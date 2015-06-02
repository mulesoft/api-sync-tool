'use strict';

var _ = require('lodash');

module.exports = function (apiPlatformRepository, fileSystemRepository, configurationRepository) {
  return {
    getAllAPIs: getAllAPIs,
    pullAPIFiles: pullAPIFiles
  };

  function getAllAPIs() {
    return apiPlatformRepository.getAllAPIs();
  }

  function pullAPIFiles(api) {
    var currentConfig = configurationRepository.getCurrentConfig();

    var makeDirectories = function (fileEntries) {
      var directoryPaths = _.pluck(
        _.filter(fileEntries, 'isDirectory'),
        'path')
        .sort();

      return Promise.all(directoryPaths.map(fileSystemRepository.makeDirectory))
        .then(function () {
          return fileEntries;
        });
    };

    var pullFiles = function (fileEntries) {
      var pullFile = function (fileMetadata) {
        var writeFile = function (file) {
          return fileSystemRepository.writeFile(file, fileMetadata.path)
            .then(function (fileHash) {
              fileMetadata.hash = fileHash;
            });
        };

        return apiPlatformRepository.getFile(api, fileMetadata.id)
          .then(writeFile);
      };

      var filesMetadata = _.reject(fileEntries, 'isDirectory');
      return Promise.all(filesMetadata.map(pullFile))
        .then(function () {
          return fileEntries;
        });
    };

    var updateFileEntries = function (fileEntries) {
      var currentConfig = configurationRepository.getCurrentConfig();
      currentConfig.files = fileEntries;
      configurationRepository.updateCurrentConfiguration(currentConfig);
      return fileEntries;
    };

    return apiPlatformRepository.getAllFileEntries(api)
      .then(makeDirectories)
      .then(pullFiles)
      .then(updateFileEntries);
  }
};
