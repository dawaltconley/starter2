var gulp = require("gulp");
var child = require("child_process");
var autoprefixer = require("gulp-autoprefixer");
var babel = require("gulp-babel");
var concat = require("gulp-concat");
var uglify = require("gulp-uglify");

function jekyllBuild(env = "development") {
    env = "JEKYLL_ENV=" + env + " ";
    child.execSync(env + "jekyll build", { stdio: "inherit" });
}

gulp.task("build", jekyllBuild.bind(null, "netlify"));

gulp.task("prefix", ["build"], function () {
    return gulp.src("./_site/css/main.css")
        .pipe(autoprefixer())
        .pipe(gulp.dest("./_site/css"));
});

gulp.task("babel", ["build"], function () {
    return gulp.src("./_site/js/main.js")
        .pipe(babel())
        .pipe(gulp.dest("./_site/js"));
});

gulp.task("uglify", ["babel"], function () {
    return gulp.src(["./_site/js/*.polyfill.js", "./_site/js/main.js"])
        .pipe(concat("main.js"))
        .pipe(uglify())
        .pipe(gulp.dest("./_site/js"))
});

gulp.task("default", ["build", "prefix", "babel", "uglify"]);
