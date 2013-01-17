# Controllers
Controllers are where the business \[logic\] happens. They ask models for data, pass it along to views, and start up other controllers as children.

There are two templates for controllers you can begin with, [BaseController](#basecontroller) and [HtmlController](#htmlcontroller), or you can write your own.

At the heart of the system, controllers are event emitters listening to `Sauron.controller(name).on('start', startFn);` and similarly for `stop`.

## BaseController
The `BaseController` function expects the following input
```js
BaseController(params);
/**
 * Constructor function for general purpose controller
 * @param {Object} params Parameters for configuring the controller
 * @param {String} params.name Name of controller (used for Sauron)
 * @param {Function} [params.start] Function to run when the controller is started via Sauron
 * @param {Function} [params.stop] Function to run when the controller is stopped via Sauron
 */
```

`BaseController` takes `params.start` and attaches it to `Sauron.controller(name).on('start', params.start);`. Additionally, `params.start` is invoked on `params` so `this` will refer to `params` while inside of `params.start`.

Similarly, the same properties take effect for `stop.

### Example
```js
BaseController({
  'name': 'myBaseController',
  'start': function () {
    console.log('Starting myBaseController');
  },
  'stop': function () {
    console.log('myBaseController stopped');
  }
});

// console.log's 'Starting myBaseController'
Sauron.start().controller('myBaseController', {});

// console.log's 'myBaseController stopped'
Sauron.stop().controller('myBaseController', {});
```

## HtmlController
`HtmlController` adds a layer on top of `BaseController`. The API remains the same but we require normalization from `params` and `Sauron` calls.

```js
// The final parameter of params will **always** be a function.
params.start = function (/* arg1, arg2, ..., */ cb) {
  // The callback expects either an HTML string, HTMLElement, DocumentFragment, or jQuery collection.
  cb('<div>some content</div>');

  // The called back content is wrapped in jQuery (normalizing everything into a jQuery collection) and appended to the first parameter of the Sauron call.
bee
  // Any additional parameters to the callback are passed to the original callback (if provided).
  // Sauron.controller('main').start($main, function (data) {
  //  // Recieves any parameters after '<div>some content</div>'
  // });
};

// Sauron calls require an HTMLElement, DocumentFragment, or a jQuery collection as their first parameter.
// You can provide a function as the last parameter to receive a callback once the controller has been started.
Sauron.controller('main').start($body, function () {
  // Called when start is complete and content done being appended
});

// HtmlController strips off the first parameter and uses it as the $container for the called back content to be appended to.
// As a result, params.start only receives ('b', 'c', 'd', cb) as parameters.
Sauron.controller('home').start($a, 'b', 'c', 'd', cb);
```

```js
// The final parameter of params will **always** be a function.
params.stop = function (/* arg1, arg2, ..., */ cb) {
  // Callback when done
  cb();
};

// You **must** call this if you manually specify a params.stop.

// When params.stop is called (even if you don't specify it), $container will be emptied and the callback (if provided) will be run.
Sauron.controller('main').stop(function () {
  // Called when stop is complete and content is removed
});
```

The reason for the stripping of the `$container` and `$html` from the callback is to enforce modularization of controllers at the framework level. It prevents any sneaky tricks/introspection between children and parents.

### Example
```js
HtmlController({
  'name': 'myHtmlController',
  'start': function (data, cb) {
    var html = '<div>' + data.val + '</div>';
    cb(html);
  },
  'stop': function (data, cb) {
    console.log(data);
    cb();
  }
});

// Start the controller on body
Sauron.start('myHtmlController').controller(document.body, {'val': 'Hello World!'}, function () {
  document.body.innerHTML; // <div>Hello World!</div>
  S

  // Stop the controller
  Sauron.stop('myHtmlController').stop('Goodbye.', function () {
    // console contains 'Goodbye.'
    document.body.innerHTML; // empty string
  });
});
```

Return to [README][readme]

[readme]: https://github.com/Ensighten/Halo/blob/master/README.md