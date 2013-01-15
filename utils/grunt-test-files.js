var path = require('path'),
    server = require('./gruntConfig').server;
module.exports = function (grunt) {
  grunt.registerHelper('test-files', function (htmlGlob, jsGlob) {
    // Expand the html and js files
    var htmlFiles = grunt.file.expandFiles(htmlGlob),
        jsFiles = grunt.file.expandFiles(jsGlob);

    // Extract the basename of the jsFiles
    var jsNames = jsFiles.map(path.basename);

    // Create the power-set of htmlFiles and jsNames
    var retArr = [];
    htmlFiles.forEach(function (file) {
      jsNames.forEach(function (test) {
        retArr.push(server + '/' + file + '?test=' + test);
      });
    });

    // Return the power set
    return retArr;
  });
};