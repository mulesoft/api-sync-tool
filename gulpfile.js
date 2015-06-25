'use strict';

var gulp = require('gulp');
var runSequence = require('run-sequence');

var jshint = require('gulp-jshint');
var jscs = require('gulp-jscs');

var mocha = require('gulp-mocha');
var istanbul = require('gulp-istanbul');

gulp.task('lint', function () {
  return gulp.src(['./**/*.js', '!./node_modules/**', '!./coverage/**'])
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'))
    .pipe(jshint.reporter('fail'));
});

gulp.task('jscs', function () {
  return gulp.src(['./**/*.js', '!./node_modules/**', '!./coverage/**'])
    .pipe(jscs({
      configPath: '.jscs.json'
    }));
});

// To run test within a particular test file, run "gulp test --file theTestFile.js"
// Test file must be under ./tests/ directory and this prefix should be ommited.
// Example: To execute test for tests/unit/csRepository.test.js run "gulp test --file unit/csRepository.test.js"
gulp.task('mocha', function (done) {
  process.env.NODE_ENV = 'test';

  gulp.src([
      './lib/commands/*.js',
      './lib/controllers/*.js',
      './lib/factories/*.js',
      './lib/repositories/*.js',
      './lib/services/*.js',
      './lib/utils/*.js'
    ])
    .pipe(istanbul())
    .pipe(istanbul.hookRequire())
    .on('finish', function () {
      var parameterIndex = process.argv.indexOf('--file');
      var testFiles = (parameterIndex !== -1) ?
        './tests/' + process.argv[parameterIndex + 1] :
        './tests/unit/*.test.js';
      gulp.src(['./tests/support/*.js', testFiles], {read: false})
        .pipe(mocha({reporter: 'spec'}))
        .pipe(istanbul.writeReports())
        .on('end', done);
    });
});

gulp.task('default', function (done) {
  runSequence('lint', 'jscs', 'mocha', done);
});
