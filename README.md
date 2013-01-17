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

There are also a bunch of [framework-specific libraries](#framework-specific-libraries) to make your life easier. Continue reading [Documentation](#documentation) to find our more.

## Documentation
Halo comes packaged with [require.js][requirejs] and [jquery][jquery] as well as a bunch of MVC nicities.

Each script is namespaced within require.js to its own filename (except for [require.js][requirejs]).

### External libraries
|           File          | Require.js namespace |                                     Description                                      |
|-------------------------|----------------------|--------------------------------------------------------------------------------------|
| [require.js][requirejs] | N/A                  | [AMD][amd] loader which exposes `require` and `define` globally.                     |
| [jquery.js][jquery]     | `jquery`             | One does not simply describe [jQuery][jquery].                                       |
| [socket.io][socketio]   | `socket.io`          | Cross-browser WebSocket implementation.                                              |
| [Sauron][sauron]        | `Sauron`             | Mediator which provides a channel system for talking between models and controllers. |
| [Builder][builder]      | `Builder`            | Build chain for client-side MVC views. You will `<3` me later.                       |

[requirejs]: http://requirejs.org/
[jquery]: http://jquery.com
[amd]: https://github.com/amdjs/amdjs-api/wiki/AMD
[socketio]: https://github.com/LearnBoost/socket.io-client
[Sauron]: https://github.com/Ensighten/Sauron
[Builder]: https://github.com/Ensighten/Builder
[jqueryp]: https://github.com/Ensighten/Builder

### Framework-specific libraries

#### mvc
`mvc` is a [require.js plugin][requirejs-plugin] which allows for easy routing to your models, views, and controllers. For example,

```js
require(['mvc!m/user']); // is equivalent to require(['models/user.js']);
require(['mvc!v/main']); // is equivalent to require(['text!views/main.html']);
require(['mvc!c/home']); // is equivalent to require(['controllers/home.js']);

// Coming soon!
require(['mvc!c/main!c/home!m/user']); // is equivalent to...
// require(['controllers/main.js', 'controllers/home.js', 'models/user']);
```

`mvc` is configured via [require.js' configuration][requirejs-config].

```js
require.config({
  'paths': {
    _modelDir: 'path/to/models', // Default: 'models'
    _modelExt: '.modelExtension', // Default: '.js'
    _controllerDir: 'path/to/controllers', // Default: 'controllers'
    _controllerExt: '.controllerExtension', // Default: '.js'
    _viewDir: 'path/to/views', // Default: 'views'
    _viewExt: '.viewExtension', // Default: '.html'
  }
});
```

URLs are constructed via `directory + '/' + module + extension`.

[requirejs-plugin]: http://requirejs.org/docs/plugins.html
[requirejs-config]: http://requirejs.org/docs/api.html#config

#### CrudModel
Basic model which binds `create`, `retrieve`, `update`, and `delete` properties to

#### SocketModel

#### BaseController

#### HtmlController

## Examples
_(Coming soon)_

// TODO: Demonstrate full stack of Builder, mvc, CrudMode, and HtmlController

// TODO: Also, do TodoMVC

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [grunt](http://gruntjs.com/).

_Also, please don't edit files in the "dist" or "stage" subdirectories as they are generated via grunt. You'll find source code in the "lib" subdirectory!_

### PhantomJS
While grunt can run the included unit tests via [PhantomJS](http://phantomjs.org/), this shouldn't be considered a substitute for the real thing. Please be sure to test the `test/*.html` unit test file(s) in _actual_ browsers.

See the [Why does grunt complain that PhantomJS isn't installed?](https://github.com/gruntjs/grunt/blob/master/docs/faq.md#why-does-grunt-complain-that-phantomjs-isnt-installed) guide in the [Grunt FAQ](https://github.com/gruntjs/grunt/blob/master/docs/faq.md) for help with installing or troubleshooting PhantomJS.

## License
Copyright (c) 2013 Ensighten
Licensed under the MIT license.
