/*global module:true */
module.exports = function(grunt) {
  var read = grunt.file.read;

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
      'src/public/js/Sauron.js': 'https://raw.github.com/Ensighten/Sauron/master/dist/Sauron.require.js',
      'src/public/js/Builder.js': 'https://raw.github.com/Ensighten/Builder/master/dist/Builder.require.jquery.js'
    },

    // Concatenate and minify repository
    concat: {
      halo: {
        src: [
          // Banner, jquery, and require first
          '<banner:meta.banner>', 'src/public/jquery.js', 'src/public/js/require.js',

          // Then Sauron.require and Builder.require.jquery.keys
          'src/public/js/Sauron.js', 'src/public/js/Builder.js',

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

    // Testing and linting
    qunit: {
      files: ['test/**/*.html']
    },
    lint: {
      files: ['grunt.js', 'src/{controllers,models}/**/*.js', 'test/*.js']
    },

    // Watch files
    watch: {
      files: ['<config:lint.files>', '<config:qunit.files>'],
      tasks: 'default'
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

  // Alias qunit as test
  grunt.registerTask('test', 'qunit');

  // Alias update as curl
  grunt.registerTask('update', 'curl');

  // Default task.
  grunt.registerTask('default', 'lint concat min test');

};
