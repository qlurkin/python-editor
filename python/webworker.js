self.languagePluginUrl = 'http://localhost:5000/pyodide/'
importScripts('./pyodide/pyodide.js')

var onmessage = function(e) {
	languagePluginLoader.then(() => {
		const data = e.data
		const keys = Object.keys(data)
		for (let key of keys) {
			if (key !== 'python') {
				// Keys other than python must be arguments for the python script.
				// Set them on self, so that `from js import key` works.
				self[key] = data[key]
			}
		}

		self.pyodide.runPythonAsync(data.python, () => {})
		.then((stdout) => { 
			self.postMessage({stdout, fs: self.pyodide.globals.fs})
		})
		.catch((err) => {
			// if you prefer messages with the error
			self.postMessage({error : err.message})
			// if you prefer onerror events
			// setTimeout(() => { throw err; });
		});
	});
}
