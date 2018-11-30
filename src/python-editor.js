import { LitElement, html } from '@polymer/lit-element';

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
        
        this.editors = []
        this.activeEditor = undefined
        this.newFileDialogShown = false
        this.output = ''

        setTimeout(() => {
            const initialContent = normalizeWhiteSpace(this.innerHTML)
            this._addEditor('Réponse', initialContent, 'python', false)
            this.activeEditor = 'Réponse'
            this.requestUpdate()
        }, 500)
    }
    
    render() {
        return html`
            <link rel="stylesheet" href="/css/codemirror.css"/>
            <link rel="stylesheet" href="/css/cobalt.css"/>
            <link rel='stylesheet' href='/css/editor.css'/>
            <div>
                <div id='top'>
                    <header>
                        <nav>
                            ${this.editors.map(editor => html`
                                <div class="tab ${editor.title === this.activeEditor ? 'active' : ''}">
                                    <button data-target="${editor.title}" @click="${this.activeTab}">${editor.title}</button>
                                    ${editor.removable ?
                                        html`<button data-target="${editor.title}" @click="${this.removeEditor}">&times;</button>` :
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
                    <form @submit="${this.addEditor}">
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

    addEditor(event) {
        const input = this.shadowRoot.querySelector('input')
        const title = input.value
        this._addEditor(title, '', 'plain', true)
        this.newFileDialogShown = false
        input.value = ""
        this.activeEditor = title
        this.requestUpdate()
        event.preventDefault()
    }

    removeEditor(event) {
        const title = event.target.dataset.target
        this._removeEditor(title)
    }

    _removeEditor(title) {
        const editor = this.getEditor(title)
        const index = this.editors.indexOf(editor)
        this.editors.splice(index, 1)
        this.requestUpdate()
    }

    activeTab(event) {
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
            const editor = this.getEditor(this.activeEditor).editor
            const wrapper = editor.getWrapperElement()
            topContent.innerHTML = ''
            topContent.appendChild(wrapper)
            editor.focus()
            setTimeout(() => {
                editor.refresh()
            }, 100)
        }
        
        if(this.newFileDialogShown) {
            this.shadowRoot.querySelector('input').focus()
        }
    }

    titleExists(title) {
        return !this.editors.every(elem => elem.title != title)
    }

    getEditor(title) {
        return this.editors.reduce((one, editor) => {
            if(editor.title == title) {
                one = editor
            }
            return one
        }, undefined)
    }

    _addEditor(title, content, mode, removable) {
        if(this.titleExists(title)) {
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

    run() {
        const fs = {}

        this.editors.map((editor) => {
            const title = editor.title
            const content = editor.editor.getValue()
            fs[title] = content
        })

        pythonExec.run(this.value, fs).then((out) => {
            this.output = out

            Object.keys(fs).map((title) => {
                const editor = this.getEditor(title)

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
        return this.getEditor('Réponse').editor.getValue()
    }

    set value(src) {
        this.getEditor('Réponse').editor.setValue(src)
        this.requestUpdate()
    }
}

customElements.define('python-editor', PythonEditor);