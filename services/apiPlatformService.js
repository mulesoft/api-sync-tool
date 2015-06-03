'use strict';

var _ = require('lodash');

module.exports = function (apiPlatformRepository, fileSystemRepository, workspaceRepository) {
  return {
    getAllAPIs: getAllAPIs,
    pullAPIFiles: pullAPIFiles
  };

  function getAllAPIs() {
    return apiPlatformRepository.getAllAPIs();
  }

  function pullAPIFiles(api) {
    var workspace = workspaceRepository.get();

    return apiPlatformRepository.pullAPIFiles(api)
      .then(function (files) {
        files.forEach(function (file) {
          return fileSystemRepository.writeFile(file);
        });

        workspace.files = _.map(files, function (file) {
          return _.omit(file, 'data');
        });
        workspaceRepository.update(workspace);

        return files;
      });
  }
};
