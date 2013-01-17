# Controllers
Controllers are where the business \[logic\] happens. They ask models for data, pass it along to views, and start up other controllers as children.

There are two templates for controllers you can begin with or you can write your own.

At the heart of the system, controllers are event emitters listening to `Sauron.controller(name).on('start', startFn);` and similarly for `stop`.

## BaseController