/*global module:false*/
module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    // Metadata.
    pkg: grunt.file.readJSON('package.json'),
    banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
            '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
            ' <%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
            ' * Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
            ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */\n',

    // Task configuration.

    clean: {
      dist: ['dist']
    },
    copy: {
      main: {
        files: [
          {expand: true, cwd: 'src/', src: ['pages/*.html','pools/**','assets/fonts/*','assets/images/**','index_page.html'], dest: 'dist/', filter: 'isFile'}
        ]
      }
    },
    useminPrepare: {
      html: 'dist/**/*.html',
      options: {
        dest: 'dist',
        root: 'src',
        flow: {
          steps: {
            js: ['concat', 'uglify'],
            css: ['concat', 'cssmin']
          },
          post: {
            js: [{
              name: 'uglify',
              createConfig: function (context, block) {
                var generated = context.options.generated;
                generated.options = {
                  banner: '<%= banner %>',
                  stripBanners: true,
                  compress: true
                };
              }
            }],
            css: [
              {
                name: 'cssmin',
                createConfig: function (context, block) {

                }
              }
            ]
          }
        }
      }
    },
    'string-replace': {
        dist: {
            files: {
                'dist/': ['dist/**/*.html','dist/**/*.js']
            },
            options: {
                replacements: [{
                    pattern: /POOL_VERSION/ig,
                    replacement: '<%= pkg.version %>'
                },
                {
                  pattern: /POOL_OUTPUT/ig,
                  replacement: '<%= pkg.name %>'
                },
                {
                  pattern: /console.log/ig,
                  replacement: 'emptyLog'
                },
                ]
            }
        }
    },
    filerev: {
      options: {
          encoding: 'utf8',
          algorithm: 'md5',
          length: 6
      },
      source: {
          files: [{
              src: [
                  'dist/assets/js/core.js',
                  'dist/assets/js/core2.js',
                  'dist/assets/js/pool.js',
                  'dist/assets/js/amCharts.js',
                  'dist/assets/js/pages/miner_stats.js',
                  'dist/assets/js/pages/home.js',
                  'dist/assets/css/core.css',
                  'dist/assets/css/pool.css'
              ]
          }]
      }
    },
    usemin: {
      html: ['dist/index_page.html','dist/pages/*.html'],
      options: {
        assetsDirs: ['dist']
      }
    },
    removeHtmlComments: {
      target: {
        files: [
          { 
            expand: true,
            src: 'dist/**/*.html'
          }
        ]
      }
    },
    jshint: {
      options: {
        curly: true,
        eqeqeq: true,
        immed: true,
        latedef: true,
        newcap: true,
        noarg: true,
        sub: true,
        undef: true,
        unused: true,
        boss: true,
        eqnull: true,
        browser: true,
        globals: {
          jQuery: true
        }
      },
      gruntfile: {
        src: 'Gruntfile.js'
      },
      lib_test: {
        src: ['src/assets/js/**/*.js']
      }
    },
    qunit: {
      files: ['test/**/*.html']
    },
    watch: {
      gruntfile: {
        files: '<%= jshint.gruntfile.src %>',
        tasks: ['jshint:gruntfile']
      },
      lib_test: {
        files: '<%= jshint.lib_test.src %>',
        tasks: ['jshint:lib_test', 'qunit']
      }
    }
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-qunit');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-string-replace');
  grunt.loadNpmTasks('grunt-filerev');
  grunt.loadNpmTasks('grunt-usemin');
  grunt.loadNpmTasks('grunt-remove-html-comments');
  grunt.loadNpmTasks('grunt-contrib-clean');

  // Default task.
  grunt.registerTask('default', ['clean:dist', 'copy', 'useminPrepare', 'concat', 'uglify', 'cssmin', 'filerev', 'usemin', 'string-replace', 'removeHtmlComments']);
  //grunt.registerTask('default', ['string-replace','jshint', 'qunit', 'concat', 'uglify']);

};
