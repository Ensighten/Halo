define("HtmlController",['Sauron', 'jquery', 'BaseController', 'PrimalClay'], function (Sauron, $, BaseController, PrimalClay) {
  function noop() {}
  function autoCallback(callback) {
    callback();
  }

  /**
   * Constructor function for HTML controller
   * @param {Object} params Parameters to load into controller
   * @param {String} params.name Name of controller (used for pub/sub)
   * @param {Function} [params.start] Pub/sub method for starting controller
   * @param {Function} [params.stop] Pub/sub method for stopping controller
   * @param {String|String[]} [params.mixin] Items to mixin to start and stop methods (currently none available)
   */
  function HtmlController(params, callback) {
    var start = params.start || autoCallback,
        stop  = params.stop || autoCallback,
        $html;

    // Overwrite start method
    params.start = function startHtmlControllerOverride (container) {
      // Collect all other arguments
      var args = [].slice.call(arguments, 1),
          argsLen = args.length,
          insertIndex = argsLen - 1,
          lastArg = args[argsLen - 1],
          callback = lastArg,
          $container = $(container);

      // If the last argument is not a callback
      if (typeof lastArg !== 'function') {
        // Overwrite the callback with noop and change the insertIndex
        callback = noop;
        insertIndex = argsLen;
      }

      // Inject our custom callback
      args[insertIndex] = function (html) {
        // Memoize arguments for callback
        var args = [].slice.call(arguments, 1);

        // Memoize $html for destruction
        $html = $(html);

        // Empty the previous container and callback when done
        $container.empty().append($html);

        // Announce that an insertion has occurred
        Sauron.voice('dom/insert', $html);

        // Callback with the arguments
        callback.apply(this, args);
      };

      // Invoke the original start method with our custom args
      start.apply(this, args);
    };

    // Overwrite stop method
    params.stop = function stopHtmlControllerOverride () {
      // Collect all arguments
      var args = [].slice.call(arguments),
          argsLen = args.length,
          insertIndex = argsLen - 1,
          lastArg = args[argsLen - 1],
          callback = lastArg;

      // If the last argument is not a callback
      if (typeof lastArg !== 'function') {
        // Overwrite the callback with noop and change the insertIndex
        callback = noop;
        insertIndex = argsLen;
      }

      // Inject callback
      args[insertIndex] = function callbackFn () {
        // Remove $html from its container
        $html.remove();

        // Announce completion of destruction
        return callback.apply(this, arguments);
      };

      // Invoke the original stop method with our custom args
      stop.apply(this, args);
    };

    // Generate and return BaseController from parameters
    return BaseController(params);
  }

  // Add PrimalClay enhancements
  var $HtmlController = PrimalClay(HtmlController);

  // Return $HtmlController template
  return $HtmlController;
});