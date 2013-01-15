function rjsDefine(module) {
  return {
    src: 'src/public/js/' + module + '.js',
    dest: 'stage/public/js/' + module + '.js',
    replacements: [{
      from: 'define(',
      to: 'define("' + module + '",'
    }]
  };
}
module.exports = rjsDefine;