/*global module:true */
module.exports = function(grunt) {
  var read = grunt.file.read,
      port = require('./utils/gruntConfig').port,
      rjsDefine = require('./utils/rjsDefine');

  // Register task for mapping out test files
  require('./utils/grunt-test-files')(grunt);

  // Project configuration.
  grunt.initConfig({
    // Package meta data
    pkg: '<json:package.json>',
    meta: {
      banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
        '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
        '<%= pkg.homepage ? "* " + pkg.homepage + "\n" : "" %>' +
        '* Copyright (c) <%= grunt.template.today("yyyy") %> Ensighten;' +
        ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */'
    },

    // Download public resources
    curl: {
      'src/public/js/jquery.js': 'http://ajax.googleapis.com/ajax/libs/jquery/1/jquery.js',
      'src/public/js/require.js': 'https://raw.github.com/jrburke/requirejs/master/require.js',
      'src/public/js/socket.io.js': 'https://raw.github.com/LearnBoost/socket.io-client/master/dist/socket.io.js',
      'src/public/js/Sauron.js': 'https://raw.github.com/Ensighten/Sauron/master/dist/Sauron.require.js',
      'src/public/js/Builder.js': 'https://raw.github.com/Ensighten/Builder/master/dist/Builder.require.jquery.js'
    },

    // Add require.js paths to files (src -> stage)
    replace: {
      'socket.io': rjsDefine('socket.io'),
      Sauron: rjsDefine('Sauron'),
      Builder: rjsDefine('Builder'),
      mvc: rjsDefine('mvc'),
      text: rjsDefine({file: 'text', singleQuotes: true}),
      BaseController: rjsDefine({module: 'BaseController', file: '../../controllers/BaseController'}),
      HtmlController: rjsDefine({module: 'HtmlController', file: '../../controllers/HtmlController'}),
      CrudModel: rjsDefine({module: 'CrudModel', file: '../../models/CrudModel'}),
      SocketModel: rjsDefine({module: 'SocketModel', file: '../../models/SocketModel'})
    },

    // Concatenate and minify repository
    concat: {
      halo: {
        src: [
          // Banner, require, and jquery first
          '<banner:meta.banner>', 'src/public/js/require.js', 'src/public/js/jquery.js',

          // Then socket.io
          // Socket.io uses anonymous define
          'stage/public/js/socket.io.js',

          // Then Sauron.require, Builder.require.jquery
          'stage/public/js/Sauron.js', 'stage/public/js/Builder.js',

          // Then text and mvc
          'stage/public/js/text.js', 'stage/public/js/mvc.js',

          // Then controllers
          'stage/controllers/BaseController.js', 'stage/controllers/HtmlController.js',

          // Then models
          'stage/models/CrudModel.js', 'stage/models/SocketModel.js'
        ],
        dest: 'dist/halo.js'
      }
    },
    min: {
      halo: {
        src: '<config:concat.halo.src>',
        dest: 'dist/halo.min.js'
      }
    },

    // Testing
    qunit: {
      // TODO: Get directive working inline
      // files: '<test-files:Halo/*.html:Halo/*.js>'
      files: grunt.task.directive('<test-files:test/*.html:test/Halo_test*.js>')
    },
    server: {
      port: port,
      base: '.'
    },

    // Linting
    lint: {
      files: [
        'grunt.js',
        'src/{controllers,models}/**/*.js',
        'public/js/{Builder,Sauron,mvc}.js',
        'test/*.js'
      ]
    },

    // Watch files
    watch: {
      files: ['<config:lint.files>', '<config:qunit.files>'],
      tasks: 'build-only test-only'
    },

    // Test options
    jshint: {
      options: {
        // curly: true,
        // eqeqeq: true,
        // immed: true,
        // latedef: true,
        // // newcap: true,
        // noarg: true,
        // sub: true,
        // undef: true,
        // boss: true,
        // eqnull: true,

        // browser: true
// {
  bitwise: false,
  camelcase: false,
  curly: false,
  eqeqeq: false,
  forin: false,
  immed: false,
  indent: false,
  latedef: false,
  newcap: false,
  noarg: false,
  noempty: false,
  nonew: false,
  plusplus: false,
  quotmark: false,
  regexp: false,
  undef: false,
  unused: false,
  strict: false,
  trailing: false,
  maxparams: false,
  maxdepth: false,
  maxstatements: false,
  maxcomplexity: false,
  maxlen: false,
  asi: false,
  boss: false,
  debug: false,
  eqnull: false,
  es5: false,
  esnext: false,
  evil: false,
  expr: false,
  funcscope: false,
  globalstrict: false,
  iterator: false,
  lastsemic: false,
  laxbreak: false,
  laxcomma: false,
  loopfunc: false,
  multistr: false,
  onecase: false,
  proto: false,
  regexdash: false,
  scripturl: false,
  smarttabs: false,
  shadow: false,
  sub: false,
  supernew: false,
  validthis: false,
  browser: false,
  couch: false,
  devel: false,
  dojo: false,
  jquery: false,
  mootools: false,
  node: false,
  nonstandard: false,
  prototypejs: false,
  rhino: false,
  worker: false,
  wsh: false,
  yui: false,
  nomen: false,
  onevar: false,
  passfail: false,
  white: false
// }
      },
      globals: {
        '$': true,
        'jQuery': true,
        'require': true,
        'define': true
      }
    },
    uglify: {}
  });

  // Load in grunt-curl
  grunt.loadNpmTasks('grunt-curl');

  // Load in requirejs bindings
  grunt.loadNpmTasks('grunt-text-replace');

  // Alias qunit as test
  grunt.registerTask('test', 'server test-only');
  grunt.registerTask('test-only', 'qunit');

  // Alias update as curl
  grunt.registerTask('update', 'curl');

  // By default, build and watch
  grunt.registerTask('default', 'build watch');

  // Set up up build task
  grunt.registerTask('build', 'build-only test');
  grunt.registerTask('build-only', 'lint replace concat min');
};
