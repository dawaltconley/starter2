var gulp = require("gulp");
var concat = require("gulp-concat");
var uglify = require("gulp-uglify");
var rename = require("gulp-rename");
var clean = require("gulp-clean");
var imageResize = require("gulp-image-resize");
var imageMin = require("gulp-imagemin");
var postcss = require("gulp-postcss");
var autoprefixer = require("autoprefixer");
var pump = require("pump");
var merge = require("merge-stream");
var child = require("child_process");
var YAML = require("js-yaml");
var fs = require("fs");

/*
 * Jekyll
 */

let jekyllEnv = "gulp";

if (process.env.CONTEXT == "production") {
    jekyllEnv = "production";
}

function jekyllBuild(env = "development") {
    var cmd = "JEKYLL_ENV=" + env + " jekyll build";
    return child.exec(cmd, { stdio: "inherit" });
}

gulp.task("build", jekyllBuild.bind(null, jekyllEnv));

/*
 * CSS
 */

gulp.task("css", function (cb) {
    pump([
        gulp.src("./_site/css/main.css"),
        postcss([
            autoprefixer()
        ]),
        gulp.dest("./_site/css")
    ], cb);
});

/*
 * Javascript
 */

gulp.task("js-concat", function (cb) {
    pump([
        gulp.src([
            "./_site/js/polyfills/*.js",
            "./_site/js/lib/*.js",
            "./_site/js/main.js",
            "!./_site/**/*.min.js",
            "!./_site/**/*.map"
        ], { allowEmpty: true }),
        concat("all.js"),
        gulp.dest("./_site/js")
    ], cb);
});

gulp.task("js-clean", function (cb) {
    pump([
        gulp.src([
            "./_site/js/polyfills",
            "./_site/js/lib",
            "./_site/js/main.js"
        ], { read: false, allowEmpty: true }),
        clean()
    ], cb);
});

gulp.task("js-uglify", function (cb) {
    pump([
        gulp.src([
            "./_site/js/**/*.js",
            "!./_site/**/*.min.js",
            "!./_site/**/*.map"
        ]),
        uglify(),
        gulp.dest("./_site/js")
    ], cb);
});

gulp.task("js", gulp.series("js-concat", "js-clean", "js-uglify"));

/*
 * Images
 */

gulp.task("image-min", function (cb) {
    pump([
        gulp.src([
            "./_site/assets/**/*",
            "!./_site/assets/**/*.svg",
            "!./_site/assets/test/*"
        ]),
        imageMin(),
        gulp.dest("./_site/assets")
    ], cb);
});

var imageBreakpoints = YAML.safeLoad(fs.readFileSync("_config.yml", "utf8"))["image_bp"];

gulp.task("responsive-images", function () {
    var src = "./_site/assets/gulp-images/*";
    var dest = "./_site/assets/gulp-images";
    var merged = merge();
    imageBreakpoints.forEach(function (bp) {
        var stream = gulp.src(src)
            .pipe(
                imageResize({
                    width: bp.x,
                    height: bp.y,
                    filter: "Catrom",
                })
            )
            .pipe(rename({ suffix: "-" + bp.x + "x" + bp.y }))
            .pipe(gulp.dest(dest));
        merged.add(stream);
    });
    return merged.isEmpty() ? null : merged;
});

gulp.task("srcset-images", function () {
    var src = "./_site/assets/gulp-srcset/*";
    var dest = "./_site/assets/gulp-srcset";
    var merged = merge();
    imageBreakpoints.forEach(function (bp) {
        var stream = gulp.src(src)
            .pipe(
                imageResize({
                    width: bp.x,
                    filter: "Catrom",
                })
            )
            .pipe(rename({ suffix: "-" + bp.x + "w" }))
            .pipe(gulp.dest(dest));
        merged.add(stream);
    });
    return merged.isEmpty() ? null : merged;
});

gulp.task("bg-images", function () {
    var src = "./_site/assets/gulp-backgrounds/*";
    var dest = "./_site/assets/gulp-backgrounds";
    var merged = merge();
    imageBreakpoints.forEach(function (bp) {
        var stream = gulp.src(src)
            .pipe(
                imageResize({
                    width: bp.x,
                    height: bp.y,
                    cover: true,
                    upscale: false,
                    filter: "Catrom",
                    interlace: true
                })
            )
            .pipe(rename({ suffix: "-" + bp.x + "x" + bp.y }))
            .pipe(gulp.dest(dest));
        merged.add(stream);
    });
    return merged.isEmpty() ? null : merged;
});

gulp.task("images", gulp.series(
    "image-min",
    gulp.parallel("responsive-images", "srcset-images", "bg-images")
));

/*
 * Build
 */

gulp.task("default", gulp.series(
    "build",
    gulp.parallel("css", "js", "images")
));
