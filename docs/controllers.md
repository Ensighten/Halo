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
  'name': 'sampleController',
  'start': function () {
    console.log('Starting sampleController');
  },
  'stop': function () {
    console.log('Stopping sampleController');
  }
});

// console.log's 'Starting sampleController'
Sauron.start().controller('sampleController', {});

// console.log's 'Stopping sampleController'
Sauron.stop().controller('sampleController', {});
```