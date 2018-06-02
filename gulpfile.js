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

function jekyllBuild(env = "development") {
    var cmd = "JEKYLL_ENV=" + env + " jekyll build";
    child.execSync(cmd, { stdio: "inherit" });
}

gulp.task("build", jekyllBuild.bind(null, "gulp"));

gulp.task("css", ["build"], function (cb) {
    pump([
        gulp.src("./_site/css/main.css"),
        postcss([
            autoprefixer()
        ]),
        gulp.dest("./_site/css")
    ], cb);
});

gulp.task("js", ["build"], function (cb) {
    pump([
        gulp.src([
            "./_site/js/polyfills/*.js",
            "./_site/js/lib/*.js",
            "./_site/js/main.js",
            "!./_site/**/*.min.js",
            "!./_site/**/*.map"
        ]),
        concat("all.js"),
        uglify(),
        gulp.dest("./_site/js")
    ], cb);
});

gulp.task("clean-js", ["js"], function (cb) {
    pump([
        gulp.src([
            "./_site/js/polyfills",
            "./_site/js/lib",
            "./_site/js/main.js"
        ], { read: false }),
        clean()
    ], cb);
});

gulp.task("image-min", ["build"], function (cb) {
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

gulp.task("images", ["image-min"], function () {
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

gulp.task("srcset-images", ["image-min"], function () {
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

gulp.task("bg-images", ["image-min"], function () {
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

gulp.task("responsive-images", ["images", "srcset-images", "bg-images"]);

gulp.task("default", ["build", "css", "js", "clean-js", "image-min", "responsive-images"]);
