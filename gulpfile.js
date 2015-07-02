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

// To run test within a particular test file, run "gulp unit --file theTestFile.js"
// Test file must be under ./tests/unit/ directory and this prefix should be ommited.
// Example: To execute test for tests/unit/csRepository.test.js run "gulp unit --file csRepository.test.js"
gulp.task('unit', function (done) {
  process.env.NODE_ENV = 'test';

  var parameterIndex = process.argv.indexOf('--file');
  var testFiles = (parameterIndex !== -1) ?
    './tests/unit/' + process.argv[parameterIndex + 1] :
    './tests/unit/*.test.js';

  testWithCoverage(testFiles, done);
});

// To run test within a particular test file, run "gulp integration --file theTestFile.js"
// Test file must be under ./tests/integration/ directory and this prefix should be ommited.
// Example: To execute test for tests/integration/setup.test.js run "gulp integration --file setup.test.js"
gulp.task('integration', function (done) {
  var parameterIndex = process.argv.indexOf('--file');
  var testFiles = (parameterIndex !== -1) ?
    './tests/integration/' + process.argv[parameterIndex + 1] :
    './tests/integration/*.test.js';

  runTests(testFiles)
    .on('end', done);
});

function testWithCoverage(testFiles, done) {
  gulp.src(['./lib/**/*.js'])
    .pipe(istanbul())
    .pipe(istanbul.hookRequire())
    .on('finish', function () {
      runTests(testFiles)
        .pipe(istanbul.writeReports())
        .on('end', done);
    });
}

function runTests(testFiles) {
  return gulp.src(['./tests/support/*.js', testFiles], {read: false})
    .pipe(mocha({reporter: 'spec'}));
}

gulp.task('default', function (done) {
  runSequence('lint', 'jscs', 'unit', 'integration', done);
});
