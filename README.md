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
<script src="dist/Halo.js"></script>
<script>
// Define a controller. Each controller has its start/stop methods proxied via Sauron, a global mediator.
define('controllers/main', ['jquery', 'mvc!c/HtmlController'], function ($, HtmlController) {
  var params = {
    // Name of the controller -- this acts as the channel for Sauron
    'name': 'main',
    // Start method to call -- invoked via Sauron.controller('main').start(args);
    'start': function (data, cb) {
      // Generate and callback with some content $("<div>hello world</div>")
      var $content = $('<div>' + data + '</div>');
      cb($content);
    }
  };
  return HtmlController(params);
});

// Require Sauron and our controller
require(['Sauron', 'controllers/main'], function (Sauron) {
  // Start the controller and render $content to $main
  var $main = $('body');

  // These are the (data, cb) passed to the 'start' defined above via Sauron, our global mediator.
  // The first parameter is stripped and used as the container for the called-back $content
  Sauron.controller('main').start($main, 'hello world', function () {
    // The callback is wrapped such that $content is automatically appended to $main
    $main.html(); // "<div>hello world</div>"
  });
});
</script>
```

// TODO: We might want to simplify the example even more

// TODO: Note about it is strongly suggested that you use the `src` folder and configure the `baseUrl` of require.js to point to the public js folder.

// This is because we cannot predict the layout structure of your repository.
// It could be all of your client-side files inside `public`, `public/js`, `static`. As a result, our pre-compiled files are optimized for **this** folder struture where the `baseUrl` is `src/public/js`. This means that all routes are looked up from the `src/public/js` folder.

// TODO: Notes on each and every .js within src

// TODO: Use this within Documentation
// Halo comes pre-packaged with require.js and jquery to get you up and running immediately


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

## License
Copyright (c) 2013 Ensighten
Licensed under the MIT license.
