define("mvc",function () {
  return {
    'load': function (name, req, onLoad, config) {
      // Determine the type and localize paths
      var type = name.charAt(0),
          paths = config.paths,
          baseUrl = config.baseUrl || '';

      // Slice up string and set up fallbacks for path parts
      var file = name.substring(2),
          dir = '',
          prefix = '';

      // Load models and controllers as JS and views via the text plugin
      switch (type) {
        case 'm':
          dir = paths._modelDir || 'models';
          ext = paths._modelExt || '.js';
          break;
        case 'v':
          prefix = 'text!';
          dir = paths._viewDir || 'views';
          ext = paths._viewExt || '.html';

          // text! automatically injects (via req.toUrl) baseUrl
          baseUrl = '';
          break;
        case 'c':
          dir = paths._controllerDir || 'controllers';
          ext = paths._controllerExt || '.js';
          break;
      }

      // Generate the URI to load
      var uri = prefix + baseUrl + dir + '/' + file + ext;

      //  up the module and return it
      require([uri], onLoad);
    }
  };
});