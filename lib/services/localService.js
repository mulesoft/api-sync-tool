'use strict';

var _ = require('lodash');

// TODO: Add logic to select appropriate repository.
module.exports = function (fileSystemRepository, workspaceRepository) {
  return {
    status: status
  };

  function status() {
    var result = {
      added: [],
      deleted: [],
      changed: [],
      unchanged: []
    };

    return fileSystemRepository.getFilesPath()
      .then(function (localFilePaths) {
        var storedFiles = workspaceRepository.get().files;

        return Promise.all(localFilePaths.map(function (localFilePath) {
          // Search file in storedFiles.
          var existingFile = _.find(storedFiles, 'path', localFilePath);

          // File exists
          if (existingFile) {
            // Remove file from stored list if it exists.
            storedFiles = _.reject(storedFiles, 'path', localFilePath);

            // If content has changed
            return fileSystemRepository.getFileHash(localFilePath)
              .then(function (hash) {
                if (existingFile.hash !== hash) {
                  result.changed.push(existingFile.path);
                } else {
                  result.unchanged.push(existingFile.path);
                }
              });
          } else {
            result.added.push(localFilePath);
          }
        })).then(function () {
          result.deleted = _.pluck(storedFiles, 'path');
          return result;
        });
    });
  }
};
