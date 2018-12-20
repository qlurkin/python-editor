import { LitElement, html } from '@polymer/lit-element';

function loadScript(url) {
    return new Promise((resolve, reject) => {
        const head = document.getElementsByTagName('head')[0]
        const script = document.createElement('script')
        script.addEventListener('load', () => {
            resolve()
        })
        head.appendChild(script)
        script.src = url
    })
}

function normalizeWhiteSpace(str) {
    let lines = str.split("\n")
    for(var i=0; i<lines.length; i++) {
        var indent = lines[i].search(/\S/)
        if(indent > 0) break
    }
    lines = lines.slice(i)
    return lines.map(function (line) {
        return line.slice(indent)
    }).join("\n").trim()
}

class PythonEditor extends LitElement {

    constructor() {
        super()
        
        this.onReady = new Promise((resolve) => {
            this._ready = () => {
                resolve()
                this._ready = undefined
            }
        })
        this.editors = []
        this.activeEditor = undefined
        this.newFileDialogShown = false
        this.output = ''


        setTimeout(() => {
            const initialContent = normalizeWhiteSpace(this.innerHTML)
            this._addEditor('Réponse', initialContent, 'python', false)
            .then(() => {
                this.activeEditor = 'Réponse'
                this.requestUpdate()
                this._ready()
            })
        }, 500)
    }
    
    render() {
        return html`
            <link rel='stylesheet' href='/comp/python-editor/css/codemirror.css'/>
            <link rel='stylesheet' href='/comp/python-editor/css/cobalt.css'/>
            <link rel='stylesheet' href='/comp/python-editor/css/editor.css'/>
            <div>
                <div id='top'>
                    <header>
                        <nav>
                            ${this.editors.map(editor => html`
                                <div class="tab ${editor.title === this.activeEditor ? 'active' : ''}">
                                    <button data-target="${editor.title}" @click="${this._tabFocus}">${editor.title}</button>
                                    ${editor.removable ?
                                        html`<button data-target="${editor.title}" @click="${this._deleteFile}">&times;</button>` :
                                        html`` }
                                </div>
                            `)}
                        </nav>
                        <div class='actions'>
                            <button @click="${this.run}"><svg viewbox="0 0 48 48"><polygon points="0,0 48,24 0,48" /></svg></button>
                            <button @click="${this.showNewFileDialog}"><svg viewbox="0 0 48 48"><polygon points="22,0 26,0 26,22 48,22 48,26 26,26 26,48 22,48 22,26 0,26 0,22 22,22" /></svg></button>
                        </div>
                    </header>
                    <div class='content'></div>
                </div>
                <div id='bottom'>
                    <header>
                        <nav>
                            <div class="tab active">
                                <button>Console</button>
                            </div>
                        </nav>
                        <div class='actions'></div>
                    </header>
                    <div class='content'>
                        <pre id="console" class='console tab-content active'>${this.output}</pre>
                    </div>
                </div>
                <div id="overlay" class="${this.newFileDialogShown ? 'show' : ''}">
                    <form @submit="${this._newFile}">
                        <input type="text" placeholder="filename"/>
                        <button type="submit">Ok</button>
                    </form>
                </div>
            </div>
        `;
    }

    showNewFileDialog() {
        this.newFileDialogShown = true
        this.requestUpdate()
    }

    _newFile(event) {
        const input = this.shadowRoot.querySelector('input')
        const title = input.value
        this._addEditor(title, '', 'plain', true)
        this.newFileDialogShown = false
        input.value = ""
        this.activeEditor = title
        this.requestUpdate()
        event.preventDefault()
    }

    _deleteFile(event) {
        const title = event.target.dataset.target
        this._removeEditor(title)
    }

    _removeEditor(title) {
        const editor = this._getEditor(title)
        const index = this.editors.indexOf(editor)
        this.editors.splice(index, 1)
        if(this.activeEditor === title) {
            this.activeEditor = "Réponse"
        }
        this.requestUpdate()
    }

    _tabFocus(event) {
        const title = event.target.dataset.target
        this._activeTab(title)
    }

    _activeTab(title) {
        this.activeEditor = title
        this.requestUpdate()
    }

    updated() {
        if(this.activeEditor) {
            const topContent = this.shadowRoot.querySelector('#top .content')
            const editor = this._getEditor(this.activeEditor).editor
            const wrapper = editor.getWrapperElement()
            topContent.innerHTML = ''
            topContent.appendChild(wrapper)
            //editor.focus()
            setTimeout(() => {
                editor.refresh()
            }, 100)
        }
        
        if(this.newFileDialogShown) {
            this.shadowRoot.querySelector('input').focus()
        }
    }

    _titleExists(title) {
        return !this.editors.every(elem => elem.title != title)
    }

    _getEditor(title) {
        return this.editors.reduce((one, editor) => {
            if(editor.title == title) {
                one = editor
            }
            return one
        }, undefined)
    }

    async _addEditor(title, content, mode, removable) {
        await depsReady

        if(this._titleExists(title)) {
            console.log('Tab title already used')
            return
        }

        if(mode === undefined) mode = 'plain'   
        if(removable === undefined) removable = true

        const wrapper = document.createElement('div')

        const editor = CodeMirror(wrapper, {
            lineNumbers: true,
            mode: mode,
            theme: 'cobalt',
            value: content,
            indentUnit: 3,
            tabSize: 3,
            indentWithTabs: true,
        })
        
        this.editors.push({
            editor,
            title,
            removable
        })
    }

    async run() {
        await this.onReady
        const fs = {}

        this.dispatchEvent(new Event('before-run', {bubbles: true, composed: true}))

        this.editors.map((editor) => {
            const title = editor.title
            const content = editor.editor.getValue()
            fs[title] = content
        })

        pythonExec.run(this.value, fs).then((out) => {
            this.output = out

            Object.keys(fs).map((title) => {
                const editor = this._getEditor(title)

                if(editor === undefined) {
                    this._addEditor(title, fs[title], 'plain', true)
                }
                else {
                    editor.editor.setValue(fs[title])
                }
            })

            this.requestUpdate()
        })
    }

    get value() {
        if(this._ready === undefined) {
            return this._getEditor('Réponse').editor.getValue()
        }
        return this.innerText
    }

    set value(src) {
        this.onReady.then(() => {
            this._getEditor('Réponse').editor.setValue(src)
            this.requestUpdate()
        })
    }
}

let ready = false
const depsReady = new Promise((resolve) => {
    document.addEventListener("DOMContentLoaded", (event) => {
        Promise.all([
            loadScript('/comp/python-editor/lib/brython.js')
                .then(() => loadScript('/comp/python-editor/lib/brython_stdlib.js'))
                .then(() => loadScript('/comp/python-editor/python-exec.js')),
            loadScript('/comp/python-editor/lib/codemirror.js')
                .then(() => loadScript('/comp/python-editor/lib/python.js')),
        ]).then(() => {
            resolve()
            ready = true
        })
    })
})

customElements.define('python-editor', PythonEditor)
