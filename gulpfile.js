var gulp = require('gulp');
var ghPages = require('gulp-gh-pages');
var child = require('child_process');

function jekyllBuild(env = 'development') {
    env = 'JEKYLL_ENV=' + env + ' ';
    child.execSync(env + 'jekyll build', { stdio: 'inherit' });
}

gulp.task('deploy', function () {
    jekyllBuild('production');
    return gulp.src('./_site/**/*')
        .pipe(ghPages());
});
