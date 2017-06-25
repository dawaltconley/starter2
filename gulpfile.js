var gulp = require('gulp');
var ghPages = require('gulp-gh-pages');
var child = require('child_process');

gulp.task('deploy', function () {
    child.execSync('JEKYLL_ENV=production jekyll build');
    return gulp.src('./_site/**/*')
        .pipe(ghPages());
});
