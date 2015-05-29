'use strict';

var fs = require('fs');
var path = require('path');
var _ = require('lodash');
var sha = require('sha');
var request = require('request');

var utils = require('../utils');
var messages = require('../messages');
var config = utils.getCurrentConfig();

module.exports = {
  execute: function (args) {
    return new Promise(function (resolve, reject) {
      var storedFiles = config.files;
      var output = '';

      readDir(process.cwd(), '');

      storedFiles.forEach(function (storedFile) {
        output += messages.status.deleted(storedFile.name);
      });

      resolve(output);

      function readDir(directory, parent) {
        var files = fs.readdirSync(directory);

        files.forEach(function (file) {
          var filePath = parent ? path.join(directory, file) : file;
          var stats = fs.statSync(filePath);

          if (stats.isDirectory()) {
            readDir(parent ? path.join(directory, file) : file, directory);
          }

          // Search file in storedFiles.
          var existingFile = _.find(storedFiles, 'name', file);
          // Remove file from stored list if it exists.
          storedFiles = _.filter(storedFiles, function (storedFile) {
            return file !== storedFile.name;
          });
          // File exists
          if (existingFile) {
            // If content has changed
            if (existingFile.hash !== sha.getSync(file)) {
              output += messages.status.changed(filePath);
            } else {
              output += messages.status.notChanged(filePath);
            }
          } else {
            output += messages.status.new(filePath);
          }
        });
      }
    });
  }
};
