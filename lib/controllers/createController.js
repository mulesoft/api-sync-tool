'use strict';

var BPromise = require('bluebird');

module.exports = function (apiPlatformService, fileSystemRepository,
    workspaceRepository) {
  return {
    create: create
  };

  function create(newApi) {
    var promises = {
      api: apiPlatformService.createAPI(newApi.bizGroup, newApi.api,
        newApi.apiVersion, newApi.rootRamlPath),
      workspace: workspaceRepository.get(),
      rootRamlHash: fileSystemRepository.getFileHash(newApi.rootRamlPath)
    };
    return BPromise.props(promises)
      .then(function (values) {
        var workspace = values.workspace;
        workspace.files = [
          {
            path: '/' + newApi.rootRamlPath,
            hash: values.rootRamlHash
          }
        ];
        return workspaceRepository.update(workspace)
          .return(values.api);
      });
  }
};
