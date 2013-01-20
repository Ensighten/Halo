define(function () {
  /**
   * Constructor wrapper that makes mixins and proxying easier
   * @param {Function} constructor
   */
  function PrimalClay(constructor) {
    // Create a set of mixins for this constructor
    var mixins = {};

    // Proxy over constructor
    // TODO: Use a unified proxy (shared by models and controllers for params.start/stop adjustments)
    // TODO: Move mixin bindings into separate exposed function
    var retFn = function (params) {
      // If there are mixins
      var mixinKey = params.mixin,
          mixinKeys = mixinKey,
          mixin,
          i,
          len;
      if (mixinKeys) {
        // If the mixinKeys are a string, upcast to an array
        if (typeof mixinKeys === 'string') {
          mixinKeys = [mixinKey];
        }

        // Iterate the mixinKeys and attach them to params
        for (i = 0, len = mixinKeys.length; i < len; i++) {
          mixinKey = mixinKeys[i];
          mixin = mixins[mixinKey];

          // If the mixin exists, attach it to params
          if (mixin) {
            params = mixin(params) || params;
          }
        }
      }

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