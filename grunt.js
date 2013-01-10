/*global module:true */
module.exports = function(grunt) {
  var read = grunt.file.read;

  // Project configuration.
  grunt.initConfig({
    pkg: '<json:package.json>',
    meta: {
      banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
        '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
        '<%= pkg.homepage ? "* " + pkg.homepage + "\n" : "" %>' +
        '* Copyright (c) <%= grunt.template.today("yyyy") %> Ensighten;' +
        ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */'
    },
    concat: {
      halo: {
        src: [
          // Banner and require first
          '<banner:meta.banner>', 'src/public/js/require.js',

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
    qunit: {
      files: ['test/**/*.html']
    },
    lint: {
      files: ['grunt.js', 'src/**/*.js', 'test/*.js']
    },
    watch: {
      files: ['<config:lint.files>', '<config:qunit.files>'],
      tasks: 'default'
    },
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

  // Alias test as qunit
  grunt.registerTask('test', 'qunit');

  // Default task.
  grunt.registerTask('default', 'lint concat min test');

};
