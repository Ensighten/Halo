/*global module:true */
module.exports = function(grunt) {
  var read = grunt.file.read,
      port = require('./utils/gruntConfig').port;

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

    // Concatenate and minify repository
    concat: {
      halo: {
        src: [
          // Banner, jquery, and require first
          '<banner:meta.banner>', 'src/public/jquery.js', 'src/public/js/require.js', 'src/public/js/socket.io.js',

          // Then Sauron.require, Builder.require.jquery, and mvc
          'src/public/js/Sauron.js', 'src/public/js/Builder.js', 'src/public/js/mvc.js',

          // Then controllers
          'src/controllers/BaseController.js', 'src/controllers/HtmlController.js',

          // Then models
          'src/models/CrudModel.js', 'src/models/SocketModel.js'
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
    requirejs: {
      halo: {
        options: {
          optimize: 'none',
          appDir: './src/',
          baseUrl: './public/js/',
          modules: [
            // {name: 'src/public/require.js'},
            {name: 'src/public/jquery.js'},
            {name: 'src/public/socket.io.js'},
            {name: 'src/public/Sauron.js'}

          // // Then Sauron.require, Builder.require.jquery, and mvc
          // 'src/public/js/Sauron.js', 'src/public/js/Builder.js', 'src/public/js/mvc.js',

          // // Then controllers
          // 'src/controllers/BaseController.js', 'src/controllers/HtmlController.js',

          // // Then models
          // 'src/models/CrudModel.js', 'src/models/SocketModel.js'
          ]
        }
      }
      // TODO: Min flavor
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
        curly: true,
        eqeqeq: true,
        immed: true,
        latedef: true,
        // newcap: true,
        noarg: true,
        sub: true,
        undef: true,
        boss: true,
        eqnull: true,

        browser: true
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
  grunt.loadNpmTasks('grunt-contrib-requirejs');

  // Alias qunit as test
  grunt.registerTask('test', 'server test-only');
  grunt.registerTask('test-only', 'qunit');

  // Alias update as curl
  grunt.registerTask('update', 'curl');

  // By default, build and watch
  grunt.registerTask('default', 'build watch');

  // Set up up build task
  grunt.registerTask('build', 'build-only test');
  grunt.registerTask('build-only', 'lint concat min');
};
