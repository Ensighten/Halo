define(function () {
  /**
   * Constructor wrapper that makes mixins and proxying easier
   * @param {Function} constructor
   */
  function PrimalClay(constructor) {
    // Create a set of mixins for this constructor
    var mixins = {};

    // Create and expose helper method to add new mixins
    function addMixin(name, fn) {
      mixins[name] = fn;
    }
    constructor.addMixin = addMixin;
    constructor.mixins = mixins;

    // Proxy over constructor
    // TODO: Use a unified proxy (shared by models and controllers for params.start/stop adjustments)
    var retFn = function (params) {
      // TODO: Inject mixin login here
    };
  }

  // Return PrimalClay
  return PrimalClay;
});