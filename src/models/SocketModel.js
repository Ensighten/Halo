/*global io:true*/
define(['Sauron', 'CrudModel', 'socket.io'], function (Sauron, CrudModel, io) {
  // Create a socket which proxies all requests
  var href = window.location.href,
      isSecure = href.slice(0, 5) === 'https',
      mainSocket = io.connect('/', {'secure': isSecure});
  function noop() {}

  /**
   * Wrapped constructor for CrudModel with socket.io. The socket is accessible via this.socket.
   * @param {Object} params Param object
   * @param {Function} [params.channel] Channel to listen to in socket.io. By default, this is params.name
   * @param {Function} [params.createEvent] Action to take for a create event from the server
   * @param {Function} [params.retrieveEvent] Action to take for a retrieve event from the server
   * @param {Function} [params.updateEvent] Action to take for an update event from the server
   * @param {Function} [params.deleteEvent] Action to take for an delete event from the server
   * @param {String|String[]} [params.mixin] Items to mixin to parameter (e.g. autoCRUD)
   * @see CrudModel
   */
  function SocketModel(params, callback) {
    // Verify params are supplied
    if (!params) {
      throw Error('You must pass in a parameters object for creating a model');
    }

    // Localize channel and create socket
    var name = params.name,
        channel = params.channel || name,
        socket = mainSocket.of(channel),
        _Sauron = Sauron.model(name);

    // Save the channel for mixins
    params.channel = channel;

    // Bind socket to params
    params.socket = socket;

    // If there are mixins specified
    var mixinKey = params.mixin,
        mixinKeys = mixinKey,
        mixin,
        i,
        len;
    if (mixinKeys !== undefined) {
      // If the mixinKeys are a string, upcast to an array
      if (typeof mixinKeys === 'string') {
        mixinKeys = [mixinKey];
      }

      // Iterate the mixinKeys and attach them to params
      for (i = 0, len = mixinKeys.length; i < len; i++) {
        mixinKey = mixinKeys[i];
        mixin = MIXINS[mixinKey];

        // If the mixin exists
        if (mixin !== undefined) {
          // Attach it to params
          params = mixin(params);
        }
      }
    }

    function bindMethod(method, methodName) {
      // If the method exists, execute it in the parameters context (access to socket)
      if (method) {
        socket.on(methodName, function () {
          // Invoke method on params object
          method.apply(params, arguments);
        });
      }

      // Always listen and announce the event
      socket.on(methodName, function () {
        _Sauron[methodName].apply(_Sauron, arguments);
      });
    }

    function execMethods(methodNameArr) {
      var methodName,
          i,
          method;

      // Iterate and execute the methods in order
      for( i = 0, len = methodNameArr.length; i < len; i++ ) {
        methodName = methodNameArr[i];
        method = params[methodName];

        bindMethod(method, methodName);
      }
    }

    // Set up all listeners
    // Anti-pattern: Iterating over an array to perform bindings
    execMethods(['createEvent', 'retrieveEvent', 'updateEvent', 'deleteEvent']);

    // Generate and return CrudModel
    return CrudModel(params, callback);
  }

  // Add sugar methods for sockets
  var Socket = io.Socket,
      SocketNS = io.SocketNamespace,
      bindTargetArr = [Socket, SocketNS],
      i = 0,
      len = bindTargetArr.length;

  function bindToSocketProto(Socket) {
    var SocketProto = Socket.prototype,
        SocketEmit = SocketProto.emit,
        SocketRequest;

    // Define socket.request which can serve as an injection point for global error handling
    SocketProto.request = SocketRequest = SocketEmit;

    // Define socket helpers which automatically specify channel
    SocketProto.create = function () {
      var args = [].slice.call(arguments);
      args.unshift('create');
      SocketRequest.apply(this, args);
    };

    SocketProto.retrieve = function () {
      var args = [].slice.call(arguments);
      args.unshift('retrieve');
      SocketRequest.apply(this, args);
    };

    SocketProto.update = function () {
      var args = [].slice.call(arguments);
      args.unshift('update');
      SocketRequest.apply(this, args);
    };

    SocketProto['delete'] = function () {
      var args = [].slice.call(arguments);
      args.unshift('delete');
      SocketRequest.apply(this, args);
    };
  }

  // Anti-pattern: Bind to both Socket and SocketNamespace prototypes
  for (; i < len; i++) {
    bindToSocketProto(bindTargetArr[i]);
  }

  // Set up mixins
  var MIXINS = {
    // If any CRUD method is not defined by model, fall it back to upstream requests to server
    'autoCRUD': function (params) {
      params.create = params.create || function autoSocketModelCreate () {
        var socket = this.socket;
        socket.create.apply(socket, arguments);
      };

      params.retrieve = params.retrieve || function autoSocketModelRetrieve () {
        var socket = this.socket;
        socket.retrieve.apply(socket, arguments);
      };

      params.update = params.update || function autoSocketModelUpdate () {
        var socket = this.socket;
        socket.update.apply(socket, arguments);
      };

      params['delete'] = params['delete'] || function autoSocketModelDelete () {
        var socket = this.socket;
        socket['delete'].apply(socket, arguments);
      };

      return params;
    }
  };

  return SocketModel;
});