from browser import window
import sys
import traceback

class FileDescriptor:
	def __init__(self, filename, fs, mode = 'r'):
		self._fs = fs
		self._filename = filename
		if len(mode) == 1:
			mode += 't'
		self._isBinary = mode[1] == 'b'
		self._access = 'read' if mode[0] == 'r' else 'write'
		self._content = ""
		if mode[0] == 'r' or mode[0] == 'a':
			if filename not in fs:
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
		return self._content.split('\n')

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

		lines = self._content.split('\n')
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

def pythonExec(src, fs={}):
    cOut = cOutput()
    stdout = sys.stdout
    sys.stdout = cOut
    stderr = sys.stderr
    sys.stderr = cOut

    try:
        ns = {
            '__name__': '__main__',
            'open': makeOpen(fs)
        }
        exec(src, ns)
    except Exception:
        traceback.print_exc(file=sys.stderr)
    
    sys.stdout.flush()
    sys.stdout = stdout
    sys.stderr = stderr

    return cOut.output

window.pythonExec._run = pythonExec
window.pythonExec.resolve()