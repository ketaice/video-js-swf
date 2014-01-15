module.exports = function (grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    bumpup: {
      options: {
        updateProps: {
          pkg: 'package.json'
        }
      },
      file: 'package.json'
    },
    tagrelease: {
      file: 'package.json',
      commit:  true,
      message: 'Release %version%',
      prefix:  'v'
    },
    connect: {
      dev: {
        port: 8000,
        base: '.'
      }
    },
    mxmlc: {
      options: {
        // http://livedocs.adobe.com/flex/3/html/help.html?content=compilers_16.html
        metadata: {
          // `-title "Adobe Flex Application"`
          title: 'VideoJS SWF',
          // `-description "http://www.adobe.com/flex"`
          description: 'http://www.videojs.com',
          // `-publisher "The Publisher"`
          publisher: 'Brightcove, Inc.',
          // `-creator "The Author"`
          creator: 'Brightcove, Inc.',
          // `-language=EN`
          // `-language+=klingon`
          language: 'EN',
          // `-localized-title "The Color" en-us -localized-title "The Colour" en-ca`
          localizedTitle: null,
          // `-localized-description "Standardized Color" en-us -localized-description "Standardised Colour" en-ca`
          localizedDescription: null,
          // `-contributor "Contributor #1" -contributor "Contributor #2"`
          contributor: null,
          // `-date "Mar 10, 2013"`
          date: null
        },

        // http://livedocs.adobe.com/flex/3/html/help.html?content=compilers_18.html
        application: {
          // `-default-size 240 240`
          layoutSize: {
            width: 640,
            height: 360
          },
          // `-default-frame-rate=24`
          frameRate: 30,
          // `-default-background-color=0x869CA7`
          backgroundColor: 0x000000,
          // `-default-script-limits 1000 60`
          scriptLimits: {
            maxRecursionDepth: 1000,
            maxExecutionTime: 60
          }
        },

        // http://livedocs.adobe.com/flex/3/html/help.html?content=compilers_19.html
        // `-library-path+=libraryPath1 -library-path+=libraryPath2`
        libraries: ['libs/*.*'],
        // http://livedocs.adobe.com/flex/3/html/help.html?content=compilers_14.html
        // http://livedocs.adobe.com/flex/3/html/help.html?content=compilers_17.html
        // http://livedocs.adobe.com/flex/3/html/help.html?content=compilers_20.html
        // http://livedocs.adobe.com/flex/3/html/help.html?content=compilers_21.html
        compiler: {
          // `-accessible=false`
          'accessible': false,
          // `-actionscript-file-encoding=UTF-8`
          'actionscriptFileEncoding': null,
          // `-allow-source-path-overlap=false`
          'allowSourcePathOverlap': false,
          // `-as3=true`
          'as3': true,
          // `-benchmark=true`
          'benchmark': true,
          // `-context-root context-path`
          'contextRoot': null,
          // `-debug=false`
          'debug': false,
          // `-defaults-css-files filePath1 ...`
          'defaultsCssFiles': [],
          // `-defaults-css-url http://example.com/main.css`
          'defaultsCssUrl': null,
          // `-define=CONFIG::debugging,true -define=CONFIG::release,false`
          // `-define+=CONFIG::bool2,false -define+=CONFIG::and1,"CONFIG::bool2 && false"
          // `-define+=NAMES::Company,"'Adobe Systems'"`
          'defines': {},
          // `-es=true -as3=false`
          'es': false,
          // `-externs className1 ...`
          'externs': [],
          // `-external-library-path+=pathElement`
          'externalLibraries': [],
          'fonts': {
            // `-fonts.advanced-anti-aliasing=false`
            advancedAntiAliasing: false,
            // `-fonts.languages.language-range "Alpha and Plus" "U+0041-U+007F,U+002B"`
            // USAGE:
            // ```
            // languages: [{
            //   lang: 'Alpha and Plus',
            //   range: ['U+0041-U+007F', 'U+002B']
            // }]
            // ```
            languages: [],
            // `-fonts.local-fonts-snapsnot filePath`
            localFontsSnapshot: null,
            // `-fonts.managers flash.fonts.JREFontManager flash.fonts.BatikFontManager flash.fonts.AFEFontManager`
            // NOTE: FontManager preference is in REVERSE order (prefers LAST array item).
            //       For more info, see http://livedocs.adobe.com/flex/3/html/help.html?content=fonts_06.html
            managers: []
          },
          // `-incremental=false`
          'incremental': false
        }
      },
      videojs_swf: {
        files: {
          'dist/video-js.swf': ['src/VideoJS.as']
        }
      }
    }

  });

  grunt.loadNpmTasks('grunt-connect');
  grunt.loadNpmTasks('grunt-bumpup');
  grunt.loadNpmTasks('grunt-tagrelease');

  grunt.registerTask('dist', ['mxmlc']);
  grunt.registerTask('default', ['dist']);

  grunt.registerMultiTask('mxmlc', 'Compiling SWF', function () {
    // Merge task-specific and/or target-specific options with these defaults.
    var childProcess = require('child_process');
    var flexSdk = require('flex-sdk');
    var async = require('async');

    var
      options = this.options,
      done = this.async(),
      maxConcurrency = 1,
      q,
      workerFn;

    workerFn = function(f, callback) {
      // Concat specified files.
      var srcList = f.src.filter(function(filepath) {
        // Warn on and remove invalid source files (if nonull was set).
        if (!grunt.file.exists(filepath)) {
          grunt.log.error('Source file "' + filepath + '" not found.');
          return false;
        }
        else {
          return true;
        }
      });

      var cmdLineOpts = [];

      if (f.dest) {
        cmdLineOpts.push('-output');
        cmdLineOpts.push(f.dest);
      }
      cmdLineOpts.push('--');
      cmdLineOpts.push.apply(cmdLineOpts, srcList);

      grunt.verbose.writeln('mxmlc path: ' + flexSdk.bin.mxmlc);
      grunt.verbose.writeln('options: ' + JSON.stringify(cmdLineOpts));

      // Compile!
      childProcess.execFile(flexSdk.bin.mxmlc, cmdLineOpts, function(err, stdout, stderr) {
        if (!err) {
          grunt.log.writeln('File "' + f.dest + '" created.');
        }
        else {
          grunt.log.error(err.toString());
          grunt.verbose.writeln('stdout: ' + stdout);
          grunt.verbose.writeln('stderr: ' + stderr);

          if (options.force === true) {
            grunt.log.warn('Should have failed but will continue because this task had the `force` option set to `true`.');
          }
          else {
            grunt.fail.warn('FAILED');
          }

        }
        callback(err);
      });
    };

    q = async.queue(workerFn, maxConcurrency);
    q.drain = done;
    q.push(this.files);
  });

  /**
   * How releases work: 
   * 
   * Changes come from pullrequests to master or stable.
   * They are tested then pulled into their base branch.
   * A change log item is added to "Unreleased".
   * In a minor/major release, master is merged into stable 
   *   (possibly by way of a release branch if testing more).
   *
   * Check out stable if not already checked out.
   * Run `grunt release:RELEASE_TYPE` 
   *   RELEASE_TYPE = major, minor, or patch
   *   Does the following:
   *     Bump version
   *     Build dist
   *     Force add dist
   *     Rotate changelog
   *     Commit changes
   *     Tag release
   *
   *  Staging should be merged back into master.
   *  Push stable and master to origin.
   *  Run `npm publish`.
   */
  grunt.registerTask('release', 'Bump, build, and tag', function(type) {
    var shell = require('shelljs');

    // major, minor, patch
    type = type ? type : 'patch';

    // git is required in add-dist, so check now
    if (!shell.which('git')) {
      grunt.fatal('Sorry, this script requires git');
    }

    if (shell.exec('git checkout stable').code !== 0) {
      grunt.fatal('`git checkout stable` failed');
    }

    grunt.task.run('bumpup:' + type); // bump up the package version
    grunt.task.run('dist');           // build distribution
    grunt.task.run('add-dist');       // force add the distribution
    grunt.task.run('tagrelease');     // commit & tag the changes
  });

  grunt.registerTask('add-dist', 'Force add the built distribution files', function(type) {
    var shell = require('shelljs');

    if (shell.exec('git add dist --force').code !== 0) {
      grunt.fatal('`git add dist --force` failed');
    }
    grunt.log.writeln('dist directory staged (git add dist --force)');
  });
};