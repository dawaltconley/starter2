const gulp = require('gulp')
const concat = require('gulp-concat')
const uglify = require('gulp-uglify')
const rename = require('gulp-rename')
const imageResize = require('gulp-image-resize')
const imageMin = require('gulp-imagemin')
const postcss = require('gulp-postcss')
const autoprefixer = require('autoprefixer')
const flexbugs = require('postcss-flexbugs-fixes')
const { pipeline } = require('stream')
const merge = require('merge-stream')
const child = require('child_process')
const YAML = require('js-yaml')
const fs = require('fs')
const path = require('path')
const globby = require('globby')
const del = require('del')
const S3 = require('aws-sdk/clients/s3')
const util = require('util')

const readFile = util.promisify(fs.readFile)
const pipePromise = util.promisify(pipeline)

let buildContext
if (process.env.NETLIFY)
    buildContext = 'netlify'
else if (process.env.CODEBUILD_BUILD_ID)
    buildContext = 'aws'

/*
 * Jekyll
 */

const jekyllEnv = process.env.CONTEXT === 'production' ? 'production' : 'gulp'

const jekyllBuild = (env = 'development', cb) => {
    assetsGlob.then(() => {
        const eachLine = (buffer, callback) => buffer.toString().split('\n').filter(s => s).forEach(callback)
        const childEnv = { ...process.env, JEKYLL_ENV: env }
        const build = child.spawn('bundle', ['exec', 'jekyll', 'build'], { env: childEnv })
        build.on('close', cb)
        build.stdout.on('data', data => eachLine(data, l => console.log(l)))
        build.stderr.on('data', data => eachLine(data, l => console.error(l)))
    })
}

gulp.task('build', cb => jekyllBuild(jekyllEnv, cb))

/*
 * AWS
 */

const s3 = new S3({ apiVersion: '2006-03-01' })

const listObjects = params => new Promise((resolve, reject) =>
    s3.listObjects(params, (e, d) => e ? reject(e) : resolve(d)))

const bucketName = readFile('.aws-bucket', { encoding: 'utf8' })
    .catch(e => {
        if (e.code === 'ENOENT' && buildContext !== 'aws')
            return ''
        else
            throw e
    })
    .then(b => b.trim())

const listBucketAssets = async dir => {
    const params = {
        Bucket: await bucketName,
        Prefix: dir.replace(/^(_site)?\//, '').trim()
    }
    let response = await listObjects(params)
    let assets = response.Contents
    while (response.IsTruncated) {
        response = await listObjects({ ...params, Marker: assets[assets.length - 1].Key })
        assets = [ ...assets, ...response.Contents ]
    }
    return assets.map(a => // this includes a LastModified key, which can be used to update same-name assets
        path.join('_site', ...a.Key.split('/')))
}

const bucketAssets = buildContext === 'aws' && jekyllEnv === 'production' ? listBucketAssets('assets') : []

/*
 * CSS
 */

gulp.task('css', cb => {
    const normalize = gulp.src('node_modules/normalize.css/normalize.css')
    const main = gulp.src('_site/css/main.css')
        .pipe(postcss([
            autoprefixer(),
            flexbugs()
        ]))

    return merge(normalize, main)
        .pipe(concat('main.css'))
        .pipe(gulp.dest('_site/css'))
})

/*
 * Javascript
 */

gulp.task('js-concat', () => pipePromise(
    gulp.src([
        '_site/js/polyfills/*.js',
        '_site/js/lib/*.js',
        '_site/js/main.js',
        '!_site/**/*.min.js',
        '!_site/**/*.map'
    ], { allowEmpty: true }),
    concat('all.js'),
    gulp.dest('_site/js')
))

gulp.task('js-clean', () => del([
    '_site/js/polyfills',
    '_site/js/lib',
    '_site/js/main.js'
]))

gulp.task('js-uglify', () => pipePromise(
    gulp.src([
        '_site/js/**/*.js',
        '!_site/**/*.min.js',
        '!_site/**/*.map'
    ]),
    uglify(),
    gulp.dest('_site/js')
))

gulp.task('js-yaml', () => pipePromise(
    gulp.src('node_modules/js-yaml/dist/js-yaml.min.js'),
    gulp.dest('_site/admin/js')
))

gulp.task('js', gulp.parallel(
    'js-yaml',
    gulp.series('js-concat', 'js-clean', 'js-uglify')
))

/*
 * Images
 */

const assetsGlob = globby('_site/assets/**/*')
const ignoreAssets = Promise.all([ assetsGlob, bucketAssets ])
    .then(assets => [].concat(...assets))

class ImageType {
    constructor (name, dir) {
        this.name = name
        this.dir = dir
        this.glob = [
            `${this.dir}/*`,
            `!${this.dir}/responsive`
        ]
        this.clean = this.clean.bind(this)
        this.clean.displayName = `${name}-clean`
        this.tasks = [ this.clean ]

        const ready = new Promise(resolve => this.ready = resolve)

        this.task = gulp.task(name, cb => {
            Promise.all([ globby(this.glob), ignoreAssets, ready ])
                .then(([ newAssets, ignoreAssets ]) => {
                    this.glob = newAssets.filter(a =>
                        ignoreAssets.indexOf(path.normalize(a)) < 0)
                    if (this.glob.length)
                        return gulp.series(this.tasks)(cb)
                    else
                        return cb()
                })
        })
    }

    clean () {
        return new Promise(resolve => {
            gulp.src(`${this.dir}/responsive/*`)
                .pipe(gulp.dest(this.dir))
                .on('end', resolve)
        }).then(() =>
            del(`${this.dir}/responsive`))
    }

    addTask (settings, suffix) {
        const task = () => pipePromise(
            gulp.src(this.glob),
            imageResize(settings),
            rename({ suffix: suffix }),
            gulp.dest(`${this.dir}/responsive`)
        )
        task.displayName = this.name + suffix
        this.tasks.splice(-1, 0, task) // add second to last in task list; before the cleaning task
    }
}

const pictures = new ImageType('pictures', '_site/assets/gulp-pictures')
const srcset = new ImageType('srcset', '_site/assets/gulp-srcset')
const backgrounds = new ImageType('backgrounds', '_site/assets/gulp-backgrounds')

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

gulp.task('og-images', cb => {
    const ogTasks = []
    const gravity = {
        lt: 'NorthWest',
        lc: 'West',
        lb: 'SouthWest',
        ct: 'North',
        cc: 'Center',
        cb: 'South',
        rt: 'NorthEast',
        rc: 'East',
        rb: 'SouthEast'
    }

    Promise.all([
        ignoreAssets,
        readFile('_site/posts.json')
    ]).then(([ ignoreAssets, ...ogImages ]) => {
        ogImages = ogImages.map(data => JSON.parse(data))
        ogImages = [].concat.apply(...ogImages)
            .filter(i => i.image)
        ogImages.forEach(i => {
            let image = i.image.split(path.sep)
            image = [ '_site', ...image ]
            i.image = path.join(...image)
        })
        ogImages = ogImages.filter(i => ignoreAssets.indexOf(i.image) < 0)
        if (!ogImages.length) return cb()

        for (let g in gravity) {
            const images = ogImages
                .filter(({ imagePosition:pos }) =>
                    pos === g || pos === '' && g === 'cc')
                .map(p => p.image)
            if (!images.length) continue
            const task = cb => pipeline(
                gulp.src(images),
                imageResize({
                    width: 1200,
                    height: 630,
                    crop: true,
                    gravity: gravity[g],
                    upscale: true
                }),
                rename({ suffix: `-${g}` }),
                gulp.dest('_site/assets/og-images'),
                cb
            )
            task.displayName = `og-images-${g}`
            ogTasks.push(task)
        }

        return gulp.series(ogTasks)(cb)
    })
})

gulp.task('image-min', () => ignoreAssets
    .then(ignore => pipePromise(
        gulp.src([
            '_site/assets/**/*',
            '!_site/assets/**/*.svg',
            '!_site/assets/test/*'
        ], { ignore: ignore }),
        imageMin(),
        gulp.dest('_site/assets'))
    )
)

gulp.task('images', gulp.series(
    'image-min',
    gulp.parallel('pictures', 'srcset', 'backgrounds', 'og-images')
))

/*
 * Build
 */

gulp.task('default', gulp.series(
    'build',
    gulp.parallel('css', 'js', 'images')
))
