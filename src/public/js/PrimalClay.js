define(function () {
  /**
   * Constructor for PrimalClay bindings
   */
  function Clay() {
    this.mixins = {};
  }
  Clay.prototype = {
    'addMixin': function (name, fn) {
      this.mixins[name] = fn;
    },
    // Bind mixins onto params
    'bindMixins': function (params) {
      // If there mixins are requested
      var mixins = this.mixins,
          mixinKey = params.mixin,
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

      // Return params
      return params;
    },
    // Bind addMixin and
    'bind': function (fn) {
      var that = this;
      fn.addMixin = function () {
        return that.addMixin.apply(that, arguments);
      };
      fn.mixins = that.mixins;
      fn.bindMixins = function () {
        return that.bindMixins.apply(that, arguments);
      };
    }
  };

  /**
   * Constructor wrapper that makes mixins and proxying easier
   * @param {Function} constructor
   */
  function PrimalClay(constructor) {
    // Create a new Clay for this constructor

    // Proxy over constructor
    // TODO: Use a unified proxy (shared by models and controllers for params.start/stop adjustments)
    // TODO: Move mixin bindings into separate exposed function
    var retFn = function (params) {

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