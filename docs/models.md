# Models
Models are the data management side of Halo. They assist in the retrieval and maintenance of resources.

There are two templates for models provided with Halo, [CrudModel](#crudmodel) and [SocketModel](#socketmodel). Additionally, you can write you own.

At the heart of the system, models are event emitters listening to `Sauron.model(name).on().create(createFn);` and similarly for all other `CRUD` methods and `CRUD` events (`retrieve`, `update`, `delete`, `createEvent`, `updateEvent`, `deleteEvent`).

## CrudModel
The `CrudModel` function expects the following input
```js
CrudModel(params);
/**
 * Constructor for CRUD Model
 * @param {Object} params Parameters for configuring the model
 * @param {String} params.name Name of the model
 * @param {Function} [params.create] Function to run when a create request is submitted via Sauron
 * @param {Function} [params.retrieve] Function to run when a retrieve request is submitted via Sauron
 * @param {Function} [params.update] Function to run when an update request is submitted via Sauron
 * @param {Function} [params.delete] Function to run when a delete request is submitted via Sauron
 * @param {String|String[]} [params.mixin] Items to mixin to the model (e.g. memory, persist)
 */
```

`CrudModel` takes `params.create` and attaches it to `Sauron.controller(name).on().create(params.create);`. Additionally, `params.create` is invoked on `params` so `this` will refer to `params` while inside of `params.create`.

Similarly, the same properties take effect for `retrieve`, `update`, and `delete`.

### Mixins
Models and controllers provide the ability to make your inheritance structure less linear with mixins.

A mixin is a function that modifies your `params` to add helper objects or proxy functions.

A good strategy for distinguishing mixins and templates is

> Does this mixin depend on any other mixins?

If so, the mixin it depends on should be a template and `this mixin` should be a mixin for said template.

#### Memory
Memory is for storing data within the scope of the window and not persisting.

The mixin string for this is `'memory'`.

Once mixed in, the object will be accessible via `params.memory/this.memory`. This object has the properties:

- memory.get(key) - Returns the value stored under `key`
- memory.set(key, val) - Stores `val` under `key`
- memory.clear() - Clears out the memory

#### Persist
A persistence mixin is available within [Halo.extras][haloExtras]. This allows for storing data permanently in the browser for all future sessions.

We avoid including it here due to lack of use and external dependencies/additional code weight.

[haloExtras]: https://github.com/Ensighten/Halo.extras

### Example
```js
CrudModel({
  'name': 'myCrudModel',
  'mixin': 'memory',
  'create': function (data, cb) {
    this.memory.set(data.id, data);
    if (cb) { cb(null); }
  },
  'retrieve': function (data, cb) {
    cb(null, this.memory.get(data.id));
  }
});

// Set some data
Sauron.model(name).create({'id': 'hello', 'val': 'world'}, function () {
  // Retrieve the data
  Sauron.model(name).retrieve({'id': 'hello'}, function (err, data) {
      data.id;  // hello
      data.val; // world
  });
});
```

## SocketModel
`SocketModel` has the same API as `CrudModel` however with additional listeners.
```js
SocketModel(params);
/**
 * Wrapped constructor for CrudModel with socket.io. The socket is accessible via this.socket.
 * @see CrudModel
 * @param {Function} [params.channel] Channel to listen to in socket.io. By default, this is params.name
 * @param {Function} [params.createEvent] Action to take for a create event from the server
 * @param {Function} [params.retrieveEvent] Action to take for a retrieve event from the server
 * @param {Function} [params.updateEvent] Action to take for an update event from the server
 * @param {Function} [params.deleteEvent] Action to take for an delete event from the server
 */
```

In addition to the new `params` properties, `params.socket/this.socket` is always bound to params upon `SocketModel` instantiation.

`params.socket` is a [socket.io][socketio] socket initialized on the specified channel (`params.channel`). Additionally, it has helper methods for talking to your server.

```js
// Socket.request is an alias for Socket.emit
// However, it introduces a layer where you can introduce global validation/sanitization
// of your requests (e.g. checking for common errors like session timeout).
Socket.request(...);

// Prepends 'create', 'retrieve', 'update', or 'delete' respectively to the list of arguments
// sent to a Socket.request call
Socket.create(...);    // Same as Socket.request('create', ...);
Socket.retrieve(...);  // Same as Socket.request('retrieve', ...);
Socket.update(...);    // Same as Socket.request('update', ...);
Socket['delete'](...); // Same as Socket.request('delete', ...);
```

### Mixins
#### autoCRUD
`autoCRUD` automatically forwards requests made to `Sauron.model(name).create(...)` to `this.Socket.create` if `params.create` does not exist (and to all other `CRUD` flavors respectively).

The mixin string for this is `'autoCRUD'`.

#### Implementation specific
There are additional mixins available within [Halo.extras][haloExtras]. Most of these were custom to our implementation and as a result, left out of the framework.

### Example
// TODO: Complete

// TODO: Review all TODO's (in repo)