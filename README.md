# Jekyll starter site

A set of shared code between my Jekyll projects.

## Installation

Depends on Jekyll, bundler, and npm.

```sh
git clone https://github.com/dawaltconley/starter.git
cd starter
bundle install
npm install # dev dependencies are used by jekyll
```

To build and serve locally: `bundle exec jekyll serve`

To build for production: `npm run build`

## Styling & SCSS

The Sass modules (located in the `_sass` directory) include most of the classes I want for convenient & quick layouting. The guiding principle is that each class should do one thing well and be reuseable, like a function. This can be as simple as the `relative` and `absolute` classes, which are just:

```scss
.relative {
  position: relative;
}

.absolute {
  position: absolute;
}
```

Or it can be more involved, as in the `expand-children` class, which expands all of an element's children to fit its size/dimensions.

```scss
// simplified to be more readable
.expand-children {
  @extend .relative;
  & > * {
    @extend .absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    width: 100%;
    height: 100%;
  }
}
```

Following the 'composable classes' idea of [tachyons](https://tachyons.io/#principles), this means that much of the styling can be done in the markup, and that you can tell more-or-less what an element will look like by its `class` attribute.

```html
<div id="container" class="expand-children">
  <img id="thumb" class="object-fit-cover" src="example.jpg" alt="">
</div>
```

Since the `@extend` feature of Sass preserves the original class order, the relative positioning of the `expand-children` class can be overridden just by adding an `absolute` class. This makes the classes more composable / functional.

```html
<div id="container" class="absolute expand-children">
  <!-- container gets absolute positioning, img is still expanded -->
  <img id="thumb" class="object-fit-cover" src="example.jpg" alt="">
</div>
```

### Generated classes

Many basic CSS classes are generated from Sass maps located in the [\_sass/\_variables.scss](https://github.com/dawaltconley/starter/blob/master/_sass/_variables.scss) module.

#### Sizes

Sizes take one or two values for width & height:

```scss
$sizes: (
    "full":   100%,         // width: 100%;  height: 100%
    "screen": 100vw 100vh,  // width: 100vw; height: 100vh
);
```

The `screen` key in that map will generate classes named `screen-width`, and `screen-height`, plus a `screen-size` class, which is shorthand for both:

```scss
.screen-size, .screen-width {
  width: 100vw; }
.screen-size, .screen-height {
  height: 100vh; }
```

It will also generate classes with `-min` and `-max` appended, which style min- and max-height respectively:

```scss
.screen-size-min, .screen-width-min {
  min-width: 100vw; }
.screen-size-min, .screen-height-min {
  min-height: 100vh; }
.screen-size-max, .screen-width-max {
  max-width: 100vw; }
.screen-size-max, .screen-height-max {
  max-height: 100vh; }
```

#### Spacings

Spacings take a single value:

```scss
$spacings: (
  "s":    15px,
  "m":    30px,
  "l":    60px,
);
```

The `m` mapping generates margin, padding, and positioning classes, named `margin-m`, `padding-m`, and `pos-m`.

The `margin-m` class will set all of an element's margins to `30px`. To set specific margins (or paddings, etc.), you can append the following:
  - `-t` for top
  - `-b` for bottom
  - `-l` for left
  - `-r` for right
  - `-v` for vertical (top and bottom)
  - `-h` for horizontal (left and right)

The CSS output looks like this:

```scss
.margin-m, .margin-m-v, .margin-m-t {
  margin-top: 30px; }
.margin-m, .margin-m-v, .margin-m-b {
  margin-bottom: 30px; }
.margin-m, .margin-m-h, .margin-m-l {
  margin-left: 30px; }
.margin-m, .margin-m-h, .margin-m-r {
  margin-right: 30px; }
```

There is also a `$default-spacing` variable, which controls the spacing used by a number of classes, such as `v-rhythm`. By default, this is `map-get($spacings, m)`.

#### Borders

The borders map takes a map of width and style values (each optional). Colors are inherited from themes and theme classes.

```scss
$borders: (
    "basic": (
        width: 1px,
        style: solid,
    ),
);
```

This creates `border-basic` class that styles all of an element's borders. You can limit it to specific borders using the same appends as the spacing classes.

The generated CSS looks like this:

```scss
.border-basic, .border-basic-v, .border-basic-t {
  border-top-width: 1px;
  border-top-style: solid; }
.border-basic, .border-basic-v, .border-basic-b {
  border-bottom-width: 1px;
  border-bottom-style: solid; }
.border-basic, .border-basic-h, .border-basic-l {
  border-left-width: 1px;
  border-left-style: solid; }
.border-basic, .border-basic-h, .border-basic-r {
  border-right-width: 1px;
  border-right-style: solid; }
```

#### Z-Index

The `$z-range` variable takes a list of two numbers, and will generate classes for z-indexes between those values. So setting `$z-range: -1, 1;` will output the following:

```scss
// position set via @extend, can be overridden by the 'absolute' class
.relative, .z-neg-1, .z-0, .z-1 {
  position: relative;
}

.z-neg-1 {
  z-index: -1; }
.z-0 {
  z-index: 0; }
.z-1 {
  z-index: 1; }
```

It will also create two classes that override other z-indexes: `front` and `back`. These are the highest and lowest z-index, plus or minus one, respectively. In this case:

```scss
.front {
  z-index: 2; }
.back {
  z-index: -2; }
```

#### Fonts

The font sizes map defines a single font size value.

```scss
$font-sizes: (
    "base": 1.25rem,
    "double": 2em,
);
```

This outputs classes named `fs-base` and `fs-icon` which set an element's font-size to that value. There are also `fs-larger` and `fs-smaller` classes, which set the font-size to the default `larger` and `smaller` values, unless overriden by a font-size defined in that map.

There is a `$base-font-size` variable, which sets the font size used by the document body. It is `$font-sizes` value named "base", unless changed. Other variables (`$base-font-family`, `$base-font-weight`, and `$base-line-height`) also affect the document body. `$base-line-length` defines the max-width of the `text-wrapper` class, and should be set to whatever value is appropriate to keep the base font at around 70-80 chars per line.

Default properties for headings are defined by the `$heading-font-family` and `$heading-font-weight` variables.

The `$heading-sizes` variable takes a list of values which define the base font sizes for headings in descending order. Any undefined headings are set to `1em`. So setting `$heading-sizes: 2em, 1.2em, 1.1em;` will output:

```scss
// letter-spacing adjusted based on font size, can be removed in _sass/_base.scss
h1, .fs-h1 {
  font-size: 2em;
  letter-spacing: -0.02em; }

h2, .fs-h2 {
  font-size: 1.2em;
  letter-spacing: -0.012em; }

h3, .fs-h3 {
  font-size: 1.1em;
  letter-spacing: -0.011em; }

h4, .fs-h4, h5, .fs-h5, h6, .fs-h6 {
  font-size: 1em;
  letter-spacing: -0.01em; }
```

Font family classes (`ff-base` and `ff-heading`) are created based on the `$base-font-family` and `$heading-font-family` variables.

Font weight classes are always generated and do not depend on anything in the [\_sass/\_variables.scss](https://github.com/dawaltconley/starter/blob/master/_sass/_variables.scss) module.

```scss
.fw-100 {
  font-weight: 100; }

.fw-200 {
  font-weight: 200; }

// etc., up to 900...

.fw-normal {
  font-weight: normal; }

.fw-bold {
  font-weight: bold; }
```

#### Transitions

The transitions map defines transition times.

```scss
$transitions: (
    "default": .3s, // used by _includes/header.html
    "long":     1s,
);
```

This outputs classes named `t-default` and `t-long` that set an element's `transition-duration` to the specified amount. This will override the transition times of other classes, which is otherwise set to `inherit`.

The variable `$t-icons` is used to set the transitions for media icons. It is the transtion named "default", unless changed.

### Themes

Themes are a special set of classes which define colors for (almost) the entire site. They are defined in the `$themes` map in the `_sass/_variables.scss` module. Each theme is a map that defines three colors: `text-color`, `background-color`, and (optionally) `brand-color`. It can also take an `accessibility` argument (`AA`, `AAA`, or `null`), which warns if the contrast ratios of the theme colors fail those WCAG standards (default is `AA`).

By default, the first theme defined in the `$theme` map will also apply to the document body.

```scss
$themes: (
    "light": (
        text-color: #171717,
        background-color: white,
        brand-color: royalblue,
        accessibility: AAA
    ),
    "dark": (
        text-color: white,
        background-color: #171717,
        brand-color: royalblue,
    ),
);
```

This produces `light` and `dark` classes, which are used to style the colors of an element ***and*** all of it's children. This is important. It means that an element can be styled according to a given theme by either inheritance...

```html
<div class="light">
  <a class="button" href="/foo">Theme Button</a>
</div>
```

...or direct assignment.

```html
<a class="light button" href="/foo">Theme Button</a>
```

This allows you to style elements within a theme differently without extra markup.

```html
<div class="light">
  <p>I am the color set by the light theme</p>
  <p class="dark">I'm the color set by the dark theme!</p>
</div>
```

This behavior is set by using the `themeify` mixin to define theme classes in [\_sass/mixins/\_themes.scss](https://github.com/dawaltconley/starter/blob/master/_sass/mixins/_themes.scss).

#### Theme classes

Theme classes are written inside the main `theme` mixin using the `themeify` mixin.

```scss
@mixin theme($background-color, $text-color, $brand-color: null) {
    $light-text: mix($text-color, $background-color, 58%);

    @include themeify(".text-light") {
        color: $light-text;
    }
}
```

This sets the class `.text-light` to apply a mix of the theme's text and background colors. If the theme is a light one (dark text on a light background), this will lighten the text, as the name implies. If the theme has light text on a dark background, this will _darkening_ it, to bring it closer to the background color.

Perhaps counter-intuitive. But when styling a site I am usually thinking of the colors of elements as relative to the rest of the page, or as serving the same _role_ within a theme. Theme classes do exactly that; they perform a function which is relative to the theme. This means that themes can be tried out, updated, and adjusted easily, even well into a site's development.

#### Themes and speceficity

Speceficity can get a little tricky when working like this. Theme styles automatically have more speceficity, since they are relative to a class. The CSS output for `text-light` looks like this:

```scss
.light .text-light, .light.text-light {
  color: #787878; }
```

As long as color is the sole and exclusive domain of themes, this works great. But if anything else is trying to set a color it will have to contend with this.

#### Theme depth

The intended (and intuitive) behavior of theme classes is that they will be styled relative to the _nearest parent theme_. Unfortunately, CSS needs some coaxing to work like this.

This is what the `$theme-depth` variable is for. `$theme-depth` controls the level at which nested themes will inherit from their nearest parent, reworking the generated CSS like so:

```scss
// $theme-depth: 1;
.light.text-light, .light .text-light,
.dark .light.text-light, .dark .light .text-light {
    color: #787878; }

// $theme-depth: 2;
.light.text-light, .light .text-light,
.dark .light.text-light, .dark .light .text-light, 
.light .dark .light.text-light, .light .dark .light .text-light {
    color: #787878; }
```

As you can see, increasing the `$theme-depth` makes each theme class _significantly_ heavier—even more so if you have three or four theme classes! I recommend nothing higher than a 1 for production sites, and a theme depth of 0 if possible.

Why are you nesting so many themes inside each other, anyway? Why did I even make this a thing you could do??

## Images

The starter site has a variety of tools for optimizing images when serving the site to production. Optimized images are split into three types, named `background`, `srcset`, and `picture`. Each live in different directories in the assets folder (`gulp-backgrounds`, `gulp-srcset`, and `gulp-pictures`).

The `gulp images` task resizes the images in these folders according to the sizes defined in [\_data/devices.yml](https://github.com/dawaltconley/starter/blob/master/_data/devices.yml). Because the responsive images are generated into the `\_site` directory by gulp, which Jekyll overwrites, images have to remain unoptimized when rebuilding using Jekyll. As a result, all of the following methods only create links to the optimized images when `JEKYLL_ENV` is set to `gulp` or `production`.

None of these methods use Javascript, so none of them are 100% accurate at serving the best image at all times.

### Backgrounds

CSS background images are styled using the `$responsive` argument of the `background-image` mixin.

```scss
.responsive-image {
  $img: url(#{$baseurl}/assets/gulp-backgrounds/example.jpg);
  @include background-image($img, $responsive: true);
}
```

This mixin uses media queries to serve an image that can _cover_ the screen (width and height), and is intended to be used with `background-size: cover;`, whith the `background-image` mixin sets by default.

### Srcset

Most `<img>` elements can be made responsive with the `gulp-srcset` include ([\_includes/gulp-srcset.liquid](https://github.com/dawaltconley/starter/blob/master/_includes/gulp-srcset.liquid)). Use it within an image's `srcset` property, passing in the image `src` and `width`. Then set the image `sizes` like you [normally would](https://developer.mozilla.org/en-US/docs/Learn/HTML/Multimedia_and_embedding/Responsive_images).

```liquid
{% assign img = '/assets/gulp-srcset/example.jpg' | prepend: site.baseurl %}
<img src="{{ img }}" alt="" srcset="{% include gulp-srcset.liquid src=img width='1080px' %}" sizes="100w">
```

### Picture

The previous method only lets you specify the _width_ that the image should have on different devices. This is fine in most cases, but if you need to constrain the image by height as well (say, with very tall and thin images), you can use the `gulp-picture` include. For this, just pass the entire `<img>` element as a parameter and it will generate a responsive `<picture>` element using the same rules as the `background-image` mixin: always at least big enough to cover the screen. 

```liquid
{% capture img %}
  <img src="{{ site.baseurl }}/assets/gulp-pictures/example.jpg" alt="">
{% endcapture %}
{% include gulp-picture.liquid img=img %}
```
