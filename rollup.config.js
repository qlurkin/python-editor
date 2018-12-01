import resolve from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';

module.exports = {
    input: 'src/python-editor.js',
    output: {
        file: 'comp/python-editor/python-editor.js',
        format: 'esm'
    },
    plugins: [ resolve() ]
}