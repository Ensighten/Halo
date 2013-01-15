// If an object, {file, module}. Otherwise, file/module.
function rjsDefine(obj) {
  // Set up fallbacks for file and module
  var file = obj.file || obj,
      module = obj.module || file;

  // Return the configuration for our require.js file
  return {
    src: 'src/public/js/' + file + '.js',
    dest: 'stage/public/js/' + file + '.js',
    replacements: [{
      from: 'define(',
      to: 'define("' + module + '",'
    }]
  };
}
module.exports = rjsDefine;