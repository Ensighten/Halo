// If we are in a non-dist test, define using baseUrl paths
if (window.location.href.indexOf('dist') === -1) {
  // Define a model for testing
  define('../src/public/js/models/user.js', function () {
    return 'a';
  });

  // Define a controller for testing
  define('../src/public/js/controllers/main.js', function () {
    return 'b';
  });
} else {
// Otherwise, define with unmodified paths
  // Define a model for testing
  define('models/user.js', function () {
    return 'a';
  });

  // Define a controller for testing
  define('controllers/main.js', function () {
    return 'b';
  });
}