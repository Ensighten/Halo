# Halo

Client-side MVC framework based on Addy Osmani's Aura.

## Getting Started
Download the [production version][min] ([vanilla][min] or [requirejs][min_require]) or the [development version][max] ([vanilla][max] or [requirejs][max_require]).

[min_require]: https://raw.github.com/Ensighten/Halo/master/dist/Halo.require.min.js
[max_require]: https://raw.github.com/Ensighten/Halo/master/dist/Halo.require.js
[min]: https://raw.github.com/Ensighten/Halo/master/dist/Halo.min.js
[max]: https://raw.github.com/Ensighten/Halo/master/dist/Halo.js

In your web page:

```html
<script src="jquery.js"></script>
<script src="dist/Halo.min.js"></script>
<script>
jQuery(function($) {
  $.awesome(); // "awesome"
});
</script>
```

## Documentation
_(Coming soon)_

## Examples
_(Coming soon)_

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [grunt](http://gruntjs.com/).

_Also, please don't edit files in the "dist" or "stage" subdirectories as they are generated via grunt. You'll find source code in the "lib" subdirectory!_

### PhantomJS
While grunt can run the included unit tests via [PhantomJS](http://phantomjs.org/), this shouldn't be considered a substitute for the real thing. Please be sure to test the `test/*.html` unit test file(s) in _actual_ browsers.

See the [Why does grunt complain that PhantomJS isn't installed?](https://github.com/gruntjs/grunt/blob/master/docs/faq.md#why-does-grunt-complain-that-phantomjs-isnt-installed) guide in the [Grunt FAQ](https://github.com/gruntjs/grunt/blob/master/docs/faq.md) for help with installing or troubleshooting PhantomJS.

## Release History
_(Nothing yet)_

## License
Copyright (c) 2013 Ensighten
Licensed under the MIT license.
