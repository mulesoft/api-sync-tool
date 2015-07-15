'use strict';

var path = require('path');

module.exports = function (apiPlatformService, BPromise, fileSystemRepository,
  localService, logger, messages, userOrganizationService, workspaceRepository) {
  return {
    create: create
  };

  function create(parametersStrategy) {
    var createAPIStrategy = {
      create: function (newApi) {
        logger.info(messages.creatingAPI());
        return apiPlatformService.createAPI(
          newApi.bizGroup,
          newApi.name,
          newApi.versionName,
          newApi.rootRamlPath);
      },
      getAPIIdentifier: function (apis, newApi, parametersStrategy) {
        return parametersStrategy.getAPIName(apis)
          .tap(function (apiName) {
            newApi.name = apiName;
          });
      }
    };

    var createAPIVersionStrategy = {
      create: function (newApi) {
        logger.info(messages.creatingAPIVersion());
        return apiPlatformService.createAPIVersion(
          newApi.bizGroup,
          newApi.id,
          newApi.versionName,
          newApi.rootRamlPath);
      },
      getAPIIdentifier: function (apis, newApi, parametersStrategy) {
        return parametersStrategy.getAPI(apis)
          .tap(function (api) {
            newApi.id = api.id;
          });
      }
    };

    return parametersStrategy.getCreateAPIorAPIVersionChoice()
      .then(function (userWantsToCreateNewAPI) {
        var creationStrategy = userWantsToCreateNewAPI ?
          createAPIStrategy :
          createAPIVersionStrategy;
        return createAPIorAPIVersion(creationStrategy, parametersStrategy);
      });
  }

  function createAPIorAPIVersion(creationStrategy, parametersStrategy) {
    var newApi = {};
    var apis;

    return userOrganizationService.getBusinessGroups()
      .then(parametersStrategy.getBusinessGroup)
      .tap(function (bizGroup) {
        newApi.bizGroup = bizGroup.id;
      })
      .then(function () {
        return apiPlatformService.getAllAPIs(newApi.bizGroup);
      })
      .tap(function (orgApis) {
        apis = orgApis;
      })
      .then(function (orgApis) {
        return creationStrategy.getAPIIdentifier(orgApis, newApi,
          parametersStrategy);
      })
      .then(function () {
        return parametersStrategy.getAPIVersionName(apis, newApi.id);
      })
      .tap(function (apiVersionName) {
        newApi.versionName = apiVersionName;
      })
      .then(localService.getFilesPath)
      .then(filterRootFiles)
      .then(parametersStrategy.getRootRamlPath)
      .tap(function (rootRamlPath) {
        newApi.rootRamlPath = rootRamlPath;
      })
      .then(function () {
        return creationStrategy.create(newApi);
      })
      .tap(function () {
        return addRootRamlToWorkspace(newApi.rootRamlPath);
      });
  }

  function addRootRamlToWorkspace(rootRamlPath) {
    var promises = {
      workspace: workspaceRepository.get(),
      rootRamlHash: fileSystemRepository.getFileHash(rootRamlPath)
    };

    return BPromise.props(promises)
      .then(function (values) {
        var workspace = values.workspace;
        workspace.files = [
          {
            path: rootRamlPath,
            hash: values.rootRamlHash
          }
        ];
        workspace.directories = [];
        return workspaceRepository.update(workspace);
      });
  }

  function filterRootFiles(filesPath) {
    return filesPath.filter(function (filePath) {
      var parsedPath = path.parse(filePath);
      return parsedPath.dir === parsedPath.root;
    });
  }
};
