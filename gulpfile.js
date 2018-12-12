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

const jekyllEnv = process.env.CONTEXT == "production" ? "production" : "gulp";

function jekyllBuild(env = "development") {
    var cmd = "JEKYLL_ENV=" + env + " bundle exec jekyll build";
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

function ImageType(name, dir) {
    this.name = name;
    this.dir = dir;

    var cleanTaskName = name + "-clean";
    gulp.task(cleanTaskName, function (cb) {
        pump([
            gulp.src(dir + "/responsive/*"), 
            clean(),
            gulp.dest(dir)
        ], cb);
    });
    this.tasks = [cleanTaskName];
}

ImageType.prototype.newTask = function (settings, suffix) {
    var taskName = this.name + suffix;
    var dir = this.dir;
    gulp.task(taskName, function (cb) {
        pump([
            gulp.src([
                dir + "/*",
                "!" + dir + "/responsive"
            ]),
            imageResize(settings),
            rename({ suffix: suffix }),
            gulp.dest(dir + "/responsive")
        ], cb)
    });
    this.tasks.splice(-1, 0, taskName); // add second to last in task list; before the cleaning task
}

var pictures = new ImageType("pictures", "./_site/assets/gulp-pictures/");
var srcset = new ImageType("srcset", "./_site/assets/gulp-srcset/");
var backgrounds = new ImageType("backgrounds", "./_site/assets/gulp-backgrounds/");

var imageSizes = YAML.safeLoad(fs.readFileSync("_data/devices.yml", "utf8"));
imageSizes["dp"].forEach(function (bp) {
    imageSizes["dppx"].forEach(function (d) {
        srcset.newTask({
            width: bp.x * d,
            filter: "Catrom"
        }, "-" + Math.round(bp.x * d) + "w");

        pictures.newTask({
            width: bp.x * d,
            height: bp.y * d,
            filter: "Catrom"
        }, "-" + bp.x + "x" + bp.y + "-" + d + "x");

        backgrounds.newTask({
            width: (bp.x * d),
            height: (bp.y * d),
            cover: true,
            upscale: false,
            filter: "Catrom",
            interlace: jekyllEnv == "production" ? true : false
        }, "-" + bp.x + "x" + bp.y + "-" + d + "x");
    });
});

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

gulp.task("pictures", gulp.series(pictures.tasks));

gulp.task("srcset", gulp.series(srcset.tasks));

gulp.task("backgrounds", gulp.series(backgrounds.tasks));

gulp.task("images", gulp.series(
    "image-min",
    gulp.parallel("pictures", "srcset", "backgrounds")
));

/*
 * Build
 */

gulp.task("default", gulp.series(
    "build",
    gulp.parallel("css", "js", "images")
));
