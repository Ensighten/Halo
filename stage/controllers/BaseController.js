define("../../controllers/BaseController",['Sauron'], function (Sauron) {
  function noop() {}

  /**
   * Constructor function for general purpose controller
   * @param {Object} params Parameters for configuring the controller
   * @param {String} params.name Name of controller (used for Sauron)
   * @param {Function} [params.start] Function to run when the controller is started via Sauron
   * @param {Function} [params.stop] Function to run when the controller is stopped via Sauron
   */
  function BaseController(params, callback) {
    params = params || {};
    var name = params.name;

    if (!name) {
      throw Error('Must specify name for a controller');
    }

    var startFn = params.start,
        stopFn = params.stop;
    if (startFn !== undefined) {
      Sauron.on().controller(name).start(startFn);
    }

    if (stopFn !== undefined) {
      Sauron.on().controller(name).stop(stopFn);
    }

    // Callback on completion of controller
    (callback || noop)();
  }

  // Return the BaseController template
  return BaseController;
});