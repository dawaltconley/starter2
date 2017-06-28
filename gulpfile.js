var gulp = require("gulp");
var ghPages = require("gulp-gh-pages");
var child = require("child_process");
var autoprefixer = require("gulp-autoprefixer");
var babel = require("gulp-babel");
var concat = require("gulp-concat");
var uglify = require("gulp-uglify");
var runSequence = require("run-sequence");

function jekyllBuild(env = "development") {
    env = "JEKYLL_ENV=" + env + " ";
    child.execSync(env + "jekyll build", { stdio: "inherit" });
}

gulp.task("prefix", function () {
    return gulp.src("./_site/css/main.css")
        .pipe(autoprefixer())
        .pipe(gulp.dest("./_site/css"));
});

gulp.task("babel", function () {
    return gulp.src("./_site/js/main.js")
        .pipe(babel())
        .pipe(gulp.dest("./_site/js"));
});

gulp.task("concat", function () {
    return gulp.src(["./_site/js/*.polyfill.js", "./_site/js/main.js"])
        .pipe(concat("main.js"))
        .pipe(gulp.dest("./_site/js"))
});

gulp.task("uglify", function () {
    return gulp.src("./_site/js/*.js")
        .pipe(uglify())
        .pipe(gulp.dest("./_site/js"))
});

gulp.task("deploy", function () {
    jekyllBuild("production");
    runSequence(["prefix", "babel"], "concat", "uglify");
    return gulp.src("./_site/**/*")
        .pipe(ghPages());
});
