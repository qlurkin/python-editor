const gulp = require('gulp')
const concat = require('gulp-concat')

// gulp.task('copy', () => 
//     gulp.src("build/tmp/src/python-editor.js")
//         .pipe(gulp.dest('build'))
// )

gulp.task('js', () => 
    gulp.src([
            'build/tmp/lib/brython.js',
            'build/tmp/lib/brython_stdlib.js',
            'build/tmp/lib/codemirror.js',
            'build/tmp/lib/python.js',
            'build/tmp/src/python-exec.js',
            'build/tmp/python-editor.js'
        ])
        .pipe(concat('python-editor.js'))
        .pipe(gulp.dest('build'))
)

gulp.task('default', ['js'])