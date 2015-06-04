'use strict';

var gulp = require('gulp');
var jshint = require('gulp-jshint');
var jscs = require('gulp-jscs');

gulp.task('lint', function () {
  return gulp.src(['./**/*.js', '!./node_modules/**'])
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'))
    .pipe(jshint.reporter('fail'));
});

gulp.task('jscs', function () {
  return gulp.src(['./**/*.js', '!./node_modules/**'])
    .pipe(jscs({
      configPath: '.jscs.json'
    }));
});

gulp.task('default', ['lint', 'jscs']);
