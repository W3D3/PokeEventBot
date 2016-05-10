// Gulpfile.js
var gulp = require('gulp'),
    nodemon = require('gulp-nodemon');

gulp.task('develop', function() {
    nodemon({
            script: 'server.js',
            ext: 'html js',
            ignore: ['ignored.js'],
            tasks: ['']
        })
        .on('restart', function() {
            console.log('restarted!');
        });
});
