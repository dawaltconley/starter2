var gulp = require('gulp');
var ghPages = require('gulp-gh-pages');
var child = require('child_process');
var autoprefixer = require('gulp-autoprefixer');
var runSequence = require('run-sequence');

function jekyllBuild(env = 'development') {
    env = 'JEKYLL_ENV=' + env + ' ';
    child.execSync(env + 'jekyll build', { stdio: 'inherit' });
}

gulp.task('prefix', function () {
    return gulp.src('./_site/css/main.css')
        .pipe(autoprefixer())
        .pipe(gulp.dest('./_site/css'))
});

gulp.task('deploy', function () {
    jekyllBuild('production');
    runSequence(['prefix']);
    return gulp.src('./_site/**/*')
        .pipe(ghPages());
});
