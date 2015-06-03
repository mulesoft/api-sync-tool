'use strict';

var _ = require('lodash');

// TODO: Add logic to select appropriate repository.
module.exports = function (fileSystemRepository, configurationRepository) {
  return {
    status: status
  };

  function status() {
    return fileSystemRepository.getFiles(process.cwd())
      .then(function (localFilePaths) {
        var result = {
          added: [],
          deleted: [],
          changed: [],
          unchanged: []
        };

        var config = configurationRepository.getCurrentConfig();
        var storedFiles = _.reject(config.files, 'isDirectory');

        localFilePaths.forEach(function (localFilePath) {
          var localFile = fileSystemRepository.readFile(localFilePath);

          // Search file in storedFiles.
          var existingFile = _.find(storedFiles, 'path', localFile.path);

          // File exists
          if (existingFile) {
            // Remove file from stored list if it exists.
            storedFiles = _.reject(storedFiles, 'path', localFile.path);

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

        result.deleted = storedFiles;

        return result;
    });
  }
};
