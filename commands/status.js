'use strict';

var _ = require('lodash');

var fsRepository = require('../repositories/fileSystemRepository');
var configurationRepository = require('../repositories/configurationRepository');

module.exports = {
  execute: function (args) {
    return fsRepository.list()
      .then(function (localFilePaths) {
        var result = {
          added: [],
          deleted: [],
          changed: [],
          unchanged: []
        };

        var config = configurationRepository.getCurrentConfig();
        var storedFiles = config.files;

        localFilePaths.forEach(function (localFilePath) {
          var localFile = fsRepository.readFile(localFilePath);

          // Search file in storedFiles.
          var existingFile = _.find(storedFiles, 'name', localFile.name);

          // File exists
          if (existingFile) {
            // Remove file from stored list if it exists.
            storedFiles = _.reject(storedFiles, 'name', localFile.name);

            // If content has changed
            if (existingFile.hash !== localFile.hash) {
              result.changed.push(existingFile);
            } else {
              result.unchanged.push(existingFile);
            }
          } else {
            result.added.push(localFile);
          }
        });
        result.deleted = _.pluck(storedFiles, 'name');

        return result;
    });
  }
};
