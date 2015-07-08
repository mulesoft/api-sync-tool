'use strict';

var BPromise = require('bluebird');

module.exports = function (apiPlatformService, fileSystemRepository,
    workspaceRepository) {
  return {
    createAPI: createAPI,
    createAPIVersion: createAPIVersion
  };

  function createAPI(newApi) {
    var apiCreation = apiPlatformService.createAPI(
      newApi.bizGroup,
      newApi.apiName,
      newApi.apiVersion,
      newApi.rootRamlPath);

    return create(apiCreation, newApi.rootRamlPath);
  }

  function createAPIVersion(newApiVersion) {
    var apiVersionCreation = apiPlatformService.createAPIVersion(
      newApiVersion.bizGroup,
      newApiVersion.apiId,
      newApiVersion.apiVersion,
      newApiVersion.rootRamlPath);

    return create(apiVersionCreation, newApiVersion.rootRamlPath);
  }

  function create(apiCreation, rootRamlPath) {
    var promises = {
      api: apiCreation,
      workspace: workspaceRepository.get(),
      rootRamlHash: fileSystemRepository.getFileHash(rootRamlPath)
    };

    return BPromise.props(promises)
      .then(function (values) {
        var workspace = values.workspace;
        workspace.files = [
          {
            path: '/' + rootRamlPath,
            hash: values.rootRamlHash
          }
        ];
        return workspaceRepository.update(workspace)
          .return(values.api);
      });
  }
};
