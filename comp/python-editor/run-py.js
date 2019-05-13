const callbacks = {}

export const subscribe = (event, callback) => {
	if(callbacks[event] === undefined)
		callbacks[event] = []

	callbacks[event].push(callback)
}

const emit = (event) => {
	if(callbacks[event] === undefined) return
	for(let cb of callbacks[event]) {
		cb()
	}
}

let pyodideWorker

const setupWorker = () => {
	return new Promise((resolve) => {
		console.log("Start Python Thread")
		emit("init")
		pyodideWorker = new Worker('/comp/python-editor/webworker.js')
		pyodideWorker.onmessage = (e) => {
			if (e.data.stdout) {
				resolve()
				emit("ready")
			} else {
				console.log("Pyodide Initialisation Error:", e.data.error)
				reject(e.data.error)
			}
		}
		pyodideWorker.postMessage({python: "True", fs: {}})
	})
}

let current = setupWorker()

export const run = (src, fs) => {
	if(fs === undefined) {
		fs = {}
	}

	console.log(fs)

	const promise = new Promise((resolve, reject) => {
		current.finally(() => {
			emit("running")
			const timer = setTimeout(() => {
				console.log("Execution take to long => kill thread")
				pyodideWorker.terminate()
				emit("kill")
				setupWorker().then(() => {
					reject(new Error("Execution Timeout"))
				})
			}, 5000)

			pyodideWorker.onerror = (e) => {
				clearTimeout(timer)
				console.log(`Error in pyodideWorker at ${e.filename}, Line: ${e.lineno}, ${e.message}`)
			}
		
			pyodideWorker.onmessage = (e) => {
				clearTimeout(timer)
				const {stdout, fs, error} = e.data
				if (stdout !== undefined) {
					console.group("Python stdout")
					console.log(stdout)
					console.groupEnd()
					console.group("Python File System")
					console.log(fs)
					console.groupEnd()
					resolve({stdout, fs})
				} else if (error !== undefined) {
					reject(error)
				}
			}

			console.group("Python Src")
			console.log(src)
			console.groupEnd()
	
			const data = {
				src,
				fs: JSON.stringify(fs),
				python: `
					import sys
					import json
					from js import src, fs

					fs = json.loads(fs)

					class FileDescriptor:
						def __init__(self, filename, fs, mode='r'):
							self._fs = fs
							self._filename = filename
							if len(mode) == 1:
								mode += 't'
							self._isBinary = mode[1] == 'b'
							self._access = 'read' if mode[0] == 'r' else 'write'
							self._content = ""
							if mode[0] == 'r' or mode[0] == 'a':
								if filename not in fs.keys():
									raise FileNotFoundError()
									
								self._content = fs[filename]
							elif mode[0] == 'x':
								if filename in fs:
									raise FileExistsError()
							self._cursor = 0

						def read(self):
							if self._access != "read":
								raise IOError("File not in read mode")
							return self._content
						
						def readlines(self):
							if self._access != "read":
								raise IOError("File not in read mode")
							return self._content.split('\\n')

						def readline(self):
							if self._access != "read":
								raise IOError("File not in read mode")
							try:
								return self.__next__()
							except StopIteration:
								return ""

						def write(self, str):
							if self._access != "write":
								raise IOError("File not in write mode")
							self._content += str

						def flush(self):
							if self._access == None:
								raise IOError("File is closed")
							if self._access == "write":
								self._fs[self._filename] = self._content

						def close(self):
							self.flush()
							self._access = None

						def __enter__(self):
							return self

						def __exit__(self, exc_type, exc_value, traceback):
							self.close()

						def __iter__(self):
							if self._access != "read":
								raise IOError("File not in read mode")
							return self

						def __next__(self):
							if self._access != "read":
								raise IOError("File not in read mode")

							lines = self._content.split('\\n')
							if self._cursor < len(lines):
								self._cursor += 1
								return lines[self._cursor-1]
							raise StopIteration()

					def makeOpen(fs):
						def open(filename, mode="r", **kwargs):
							return FileDescriptor(filename, fs, mode)
						return open

					class cOutput:
						encoding = 'utf-8'

						def __init__(self):
							self.output = ''
							self.buf = ''

						def write(self, data):
							self.buf += str(data)

						def flush(self):
							self.output += self.buf
							self.buf = ''

						def __len__(self):
							return len(self.buf)

					cOut = cOutput()
					stdout = sys.stdout
					sys.stdout = cOut
					stderr = sys.stderr
					sys.stderr = cOut

					ns = {
						'__name__': '__main__',
						'open': makeOpen(fs)
					}
					exec(src, ns)

					sys.stdout.flush()
					sys.stdout = stdout
					sys.stderr = stderr

					cOut.output
				`
			}
			
			pyodideWorker.postMessage(data)
		})
		
	})

	current = promise.finally(() => {emit("ready")})
	return promise
}