define(function () {
  /**
   * Constructor wrapper that makes mixins and proxying easier
   * @param {Function} constructor
   */
  function PrimalClay(constructor) {
    // Create a set of mixins for this constructor
    var mixins = {};

    // TODO: Move to an OOP approach for mixins and such (more extensibility). Just don't go in the wrong direction like dev/primal.clay.oop
    function bindMixins(params) {
      // If there are mixins requested
      var mixinKeys = params.mixin;
      if (mixinKeys) {
        // If the mixinKeys are a string, upcast to an array
        if (typeof mixinKeys === 'string') {
          mixinKeys = [mixinKeys];
        }

        // Iterate the mixinKeys and attach them to params
        var mixinKey,
            mixin,
            i = 0,
            len = mixinKeys.length;
        for (; i < len; i++) {
          mixinKey = mixinKeys[i];
          mixin = mixins[mixinKey];

          // If the mixin exists, attach it to params
          if (mixin) {
            params = mixin(params) || params;
          }
        }
      }

      // Return params
      return params;
    }

    // Proxy over constructor
    // TODO: Use a unified proxy (shared by models and controllers for params.start/stop adjustments)
    // TODO: Move mixin bindings into separate exposed function
    var retFn = function (params) {
      // Bind mixins
      params = bindMixins(params);

      // Call and return the original function
      return constructor.apply(this, arguments);
    };

    // Create and expose helper method to add new mixins
    function addMixin(name, fn) {
      mixins[name] = fn;
    }
    retFn.addMixin = addMixin;
    retFn.mixins = mixins;

    // Return the retFn
    return retFn;
  }

  // Return PrimalClay
  return PrimalClay;
});