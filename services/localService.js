'use strict';

var _ = require('lodash');

// TODO: Add logic to select appropriate repository.
module.exports = function (fileSystemRepository, workspaceRepository) {
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

        var storedFiles = workspaceRepository.get().files;

        localFilePaths.forEach(function (localFilePath) {
          var localFile = fileSystemRepository.readFile(localFilePath);

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
        result.deleted = storedFiles;

        return result;
    });
  }
};
