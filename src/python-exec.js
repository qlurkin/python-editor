window.pythonExec = {
    _run: null
}

window.pythonExec.ready = new Promise((resolve, reject) => {
    window.pythonExec.resolve = () => {
        resolve()
        delete window.pythonExec.resolve
    }
})

window.pythonExec.run = src => {
    return new Promise((resolve, reject) => {
        window.pythonExec.ready.then(() => {
            resolve(window.pythonExec._run(src))
        })
    })
}

window.addEventListener('load', () => {
    const body = document.querySelector('body')
    const script = document.createElement('script')
    script.type = 'text/python'
    script.src = '/src/python-exec.py'
    body.appendChild(script)
    brython()
})