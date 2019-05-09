import { run, subscribe } from "./run-py.js"

// run("print('hello')\nprint(1+1)\nwhile True:\n\tpass").then((res) => {
// 	console.group("Python Output")
// 	console.log(res)
// 	console.groupEnd()
// }).catch((err) => {
// 	console.group("Python Error")
// 	console.log(err)
// 	console.groupEnd()
// })

// run("print('world')\nprint(2+2)\nfile=open('truc', 'w')\nfile.write('prout')\nfile.close()").then((res) => {
// 	console.group("Python Output")
// 	console.log(res.stdout)
// 	console.log(res.fs)
// 	console.groupEnd()
// }).catch((err) => {
// 	console.group("Python Error")
// 	console.log(err)
// 	console.groupEnd()
// })

const state = document.getElementById("state")

subscribe("ready", () => {state.innerText = "Ready"})
subscribe("kill", () => {state.innerText = "Dead"})
subscribe("running", () => {state.innerText = "Running"})
subscribe("init", () => {state.innerText = "Initialization"})

document.getElementById('run').addEventListener("click", () => {
	const src = document.getElementById('code').value
	const stdout = document.getElementById('stdout')
	run(src).then((res) => {
		console.group("Python Output")
		console.log(res.stdout)
		stdout.value = res.stdout
		console.groupEnd()
		console.group("Virtual File System")
		console.log(res.fs)
		console.groupEnd()
	}).catch((err) => {
		console.group("Python Error")
		console.log(err)
		stdout.value = err
		console.groupEnd()
	})
})