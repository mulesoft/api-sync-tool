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

    return apiPlatformRepository.pullAPIFiles(api)
      .then(function (files) {
        files.forEach(function (file) {
          return fileSystemRepository.writeFile(file);
        });

        currentConfig.files = _.map(files, function (file) {
          return _.omit(file, 'data');
        });
        configurationRepository.updateCurrentConfiguration(currentConfig);

        return files;
      });
  }
};
