'use strict';

var path = require('path');
path.parse = path.parse || require('path-parse');

module.exports = function (apiPlatformService, BPromise, fileSystemRepository,
    localService, logger, messages, userOrganizationService, workspaceRepository) {
  return {
    create: create
  };

  function create(parametersStrategy) {
    return createAPIorAPIVersion(parametersStrategy);
  }

  function createAPIorAPIVersion(parametersStrategy) {
    var newApi = {};
    var apis;
    var creationStrategy;

    return userOrganizationService.getBusinessGroups()
      .then(parametersStrategy.getBusinessGroup)
      .tap(function (bizGroup) {
        newApi.bizGroup = bizGroup.id;
      })
      .then(parametersStrategy.getCreateAPIorAPIVersionChoice)
      .tap(function (userWantsToCreateNewAPI) {
        creationStrategy = createStrategyFactory(userWantsToCreateNewAPI);
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
      .tap(function (createdApi) {
        return addRootRamlToWorkspace(createdApi.rootRamlFile);
      });
  }

  function addRootRamlToWorkspace(rootRamlFile) {
    var promises = {
      workspace: workspaceRepository.get(),
      rootRamlHash: fileSystemRepository.getFileHash(rootRamlFile.path)
    };

    return BPromise.props(promises)
      .then(function (values) {
        var workspace = values.workspace;
        rootRamlFile.hash = values.rootRamlHash;

        workspace.files = [rootRamlFile];
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

  function createStrategyFactory(shouldCreateAPI) {
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

    return shouldCreateAPI ? createAPIStrategy : createAPIVersionStrategy;
  }
};
