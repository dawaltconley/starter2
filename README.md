# Jekyll starter site

A set of shared code between my Jekyll projects.

## Install

Depends on Jekyll, bundler, and npm.

```sh
site_directory=path/to/site
git clone https://github.com/dawaltconley/starter.git $site_directory
cd $site_directory
bundle install
npm install
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

Many basic CSS classes are generated from Sass maps located in the `_sass/_variables.scss` module.

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

```css
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
