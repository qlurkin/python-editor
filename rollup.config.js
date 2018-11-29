import resolve from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';

module.exports = {
    input: 'src/python-editor.js',
    output: {
        file: 'build/tmp/python-editor.js',
        format: 'iife'
    },
    plugins: [ resolve() ]
}