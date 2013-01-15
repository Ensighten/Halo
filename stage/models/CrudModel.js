define("../../models/CrudModel.js",['Sauron'], function (Sauron) {
  function noop() {}
  /**
   * Constructor for CRUD Model
   * @param {Object} params Parameters for configuring the model
   * @param {String} params.name Name of the model
   * @param {Function} [params.create] Function for creation in the model
   * @param {Function} [params.retrieve] Function for retrieving from the model
   * @param {Function} [params.update] Function for updates in the model
   * @param {Function} [params.delete] Function for deletion in the model
   * @param {String|String[]} [params.mixin] Items to mixin to the model (e.g. memory, persist)
   * @param {String} [params.persistKey] Subnamespace for persistent memory
   */
  function CrudModel(params, callback) {
    if ( !params ) { throw Error('You must give a params object when constructing a CrudModel'); }
    var name = params.name;

    if( !name ) {
      throw Error('Must specify name for a model');
    }

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

    // For each method, add a Sauron listener
    var create = params.create,
        retrieve = params.retrieve,
        update = params.update,
        del = params['delete'];
    if (create) {
      // Sauron.on().model().create(), .retrieve, ...
      Sauron.on().model(name).create(function () {
        // Type cast arguments for passing
        var args = [].slice.call(arguments);

        // Call start with all of our arguments and 'this' set to params (for socket + memory)
        create.apply(params, args);
      });
    }

    if (retrieve) {
      Sauron.on().model(name).retrieve(function () {
        var args = [].slice.call(arguments);
        retrieve.apply(params, args);
      });
    }

    if (update) {
      Sauron.on().model(name).update(function () {
        var args = [].slice.call(arguments);
        update.apply(params, args);
      });
    }

    if (del) {
      Sauron.on().model(name)['delete'](function () {
        var args = [].slice.call(arguments);
        del.apply(params, args);
      });
    }

    // Announce completion of creation
    (callback || noop)('CrudModel', params);

    // Return something
    return {};
  }

  var MIXINS = {
    'memory': function (params) {
      // Bind memory store to params
      var memory = {};
      params.memory = {
        'set': function (key, val) {
          memory[key] = val;
        },
        'get': function (key) {
          return memory[key];
        },
        'clear': function () {
          memory = {};
        }
      };

      // Return the modified params
      return params;
    }
  };

  // DEPRECATED: In very first iteration, we used asynchronous templating. Unfortunately, it disagreed with the synchronous require.js model.
  // // Subscribe to creation channel
  // Sauron.on().createModel('CrudModel', CrudModel);

  // Return model for proper timing currently
  return CrudModel;
});