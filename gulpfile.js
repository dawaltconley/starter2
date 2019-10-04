const gulp = require('gulp')
const concat = require('gulp-concat')
const uglify = require('gulp-uglify')
const rename = require('gulp-rename')
const clean = require('gulp-clean')
const imageResize = require('gulp-image-resize')
const imageMin = require('gulp-imagemin')
const postcss = require('gulp-postcss')
const autoprefixer = require('autoprefixer')
const flexbugs = require('postcss-flexbugs-fixes')
const pump = require('pump')
const merge = require('merge-stream')
const child = require('child_process')
const YAML = require('js-yaml')
const fs = require('fs')

/*
 * Jekyll
 */

const jekyllEnv = process.env.CONTEXT === 'production' ? 'production' : 'gulp'

const jekyllBuild = (env = 'development', cb) => {
    const eachLine = (buffer, callback) => buffer.toString().split('\n').filter(s => s).forEach(callback)
    const childEnv = { ...process.env, JEKYLL_ENV: env }
    const build = child.spawn('bundle', ['exec', 'jekyll', 'build'], { env: childEnv })
    build.on('close', cb)
    build.stdout.on('data', data => eachLine(data, l => console.log(l)))
    build.stderr.on('data', data => eachLine(data, l => console.error(l)))
}

gulp.task('build', cb => jekyllBuild(jekyllEnv, cb))

/*
 * CSS
 */

gulp.task('css', cb => {
    const normalize = gulp.src('./node_modules/normalize.css/normalize.css')
    const main = gulp.src('./_site/css/main.css')
        .pipe(postcss([
            autoprefixer(),
            flexbugs()
        ]))

    return merge(normalize, main)
        .pipe(concat('main.css'))
        .pipe(gulp.dest('./_site/css'))
})

/*
 * Javascript
 */

gulp.task('js-concat', cb => {
    pump([
        gulp.src([
            './_site/js/polyfills/*.js',
            './_site/js/lib/*.js',
            './_site/js/main.js',
            '!./_site/**/*.min.js',
            '!./_site/**/*.map'
        ], { allowEmpty: true }),
        concat('all.js'),
        gulp.dest('./_site/js')
    ], cb)
})

gulp.task('js-clean', cb => {
    pump([
        gulp.src([
            './_site/js/polyfills',
            './_site/js/lib',
            './_site/js/main.js'
        ], { read: false, allowEmpty: true }),
        clean()
    ], cb)
})

gulp.task('js-uglify', cb => {
    pump([
        gulp.src([
            './_site/js/**/*.js',
            '!./_site/**/*.min.js',
            '!./_site/**/*.map'
        ]),
        uglify(),
        gulp.dest('./_site/js')
    ], cb)
})

gulp.task('js-yaml', cb => {
    pump([
        gulp.src('./node_modules/js-yaml/dist/js-yaml.min.js'),
        gulp.dest('./_site/admin/js')
    ], cb)
})

gulp.task('js', gulp.parallel(
    'js-yaml',
    gulp.series('js-concat', 'js-clean', 'js-uglify')
))

/*
 * Images
 */

const readFile = file => new Promise((resolve, reject) =>
    fs.readFile(file, (err, data) =>
        err ? reject(err) : resolve(data)))

class ImageType {
    constructor (name, dir) {
        this.name = name
        this.dir = dir
        this.clean = this.clean.bind(this)
        this.clean.displayName = `${name}-clean`
        this.tasks = [ this.clean ]

        const ready = new Promise(resolve => { this.ready = resolve })
        this.task = gulp.task(name, cb =>
            ready.then(() => gulp.series(this.tasks)(cb)))
    }

    clean (cb) {
        pump([
            gulp.src(`${this.dir}/responsive/*`),
            clean(),
            gulp.dest(this.dir)
        ], cb)
    }

    addTask (settings, suffix) {
        const task = cb => {
            pump([
                gulp.src([
                    `${this.dir}/*`,
                    `!${this.dir}/responsive`
                ]),
                imageResize(settings),
                rename({ suffix: suffix }),
                gulp.dest(`${this.dir}/responsive`)
            ], cb)
        }
        task.displayName = this.name + suffix
        this.tasks.splice(-1, 0, task) // add second to last in task list; before the cleaning task
    }
}

const pictures = new ImageType('pictures', './_site/assets/gulp-pictures/')
const srcset = new ImageType('srcset', './_site/assets/gulp-srcset/')
const backgrounds = new ImageType('backgrounds', './_site/assets/gulp-backgrounds/')

readFile('_data/devices.yml').then(data => {
    const imageSizes = YAML.safeLoad(data);
    imageSizes['dp'].forEach(bp => {
        imageSizes['dppx'].forEach(d => {
            srcset.addTask({
                width: bp.x * d,
                filter: 'Catrom'
            }, `-${Math.round(bp.x * d)}w`)

            pictures.addTask({
                width: bp.x * d,
                height: bp.y * d,
                filter: 'Catrom'
            }, `-${bp.x}x${bp.y}-${d}x`)

            backgrounds.addTask({
                width: (bp.x * d),
                height: (bp.y * d),
                cover: true,
                upscale: false,
                filter: 'Catrom',
                interlace: jekyllEnv === 'production' ? true : false
            }, `-${bp.x}x${bp.y}-${d}x`)
        })
    });
    [ srcset, pictures, backgrounds ].forEach(i => i.ready());
})

gulp.task('image-min', cb => {
    pump([
        gulp.src([
            './_site/assets/**/*',
            '!./_site/assets/**/*.svg',
            '!./_site/assets/test/*'
        ]),
        imageMin(),
        gulp.dest('./_site/assets')
    ], cb)
})

gulp.task('images', gulp.series(
    'image-min',
    gulp.parallel('pictures', 'srcset', 'backgrounds')
))

/*
 * Build
 */

gulp.task('default', gulp.series(
    'build',
    gulp.parallel('css', 'js', 'images')
))
