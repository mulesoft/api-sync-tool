'use strict';

var _    = require('lodash');
var path = require('path');
path.parse = path.parse || require('path-parse');

module.exports = function (apiPlatformService, BPromise, errors, fileSystemRepository,
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
        return creationStrategy.getAPIVersionName(apis, newApi,
          parametersStrategy);
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
    var getAPIVersionName = function getAPIVersionName(apis, newApi, parametersStrategy, errMessage) {
      return parametersStrategy.getAPIVersionNameInput(errMessage)
        .tap(checkFieldIsNotEmpty)
        .tap(function (versionName) {
          return checkAPIVersionNameIsNotUsed(apis, newApi.id, versionName);
        })
        .catch(function (err) {
          if (err instanceof errors.RepeatedAPIVersionNameError ||
              err instanceof errors.EmptyFieldError) {
            logger.info(err.message);
            return getAPIVersionName(apis, newApi, parametersStrategy, err.message);
          }

          return BPromise.reject(err);
        })
        .tap(function (apiVersionName) {
          newApi.versionName = apiVersionName;
        })
      ;
    };
    var createAPIStrategy = {
      create: function (newApi) {
        logger.info(messages.creatingAPI());
        return apiPlatformService.createAPI(
          newApi.bizGroup,
          newApi.name,
          newApi.versionName,
          newApi.rootRamlPath);
      },
      getAPIIdentifier: function (apis, newApi, parametersStrategy, errMessage) {
        var self = this;
        return parametersStrategy.getAPINameInput(errMessage)
          .tap(checkFieldIsNotEmpty)
          .tap(function (apiName) {
            return checkAPINameIsNotUsed(apis, apiName);
          })
          .catch(function (err) {
            if (err instanceof errors.RepeatedAPINameError ||
                err instanceof errors.EmptyFieldError) {
              logger.info(err.message);
              return self.getAPIIdentifier(apis, newApi, parametersStrategy, err.message);
            }

            return BPromise.reject(err);
          })
          .tap(function (apiName) {
            newApi.name = apiName;
          })
        ;
      },
      getAPIVersionName: getAPIVersionName
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
      },
      getAPIVersionName: getAPIVersionName
    };

    return shouldCreateAPI ? createAPIStrategy : createAPIVersionStrategy;
  }

  function checkFieldIsNotEmpty(value) {
    if (value.trim() === '') {
      return BPromise.reject(new errors.EmptyFieldError());
    }
  }

  function checkAPINameIsNotUsed(apis, apiName) {
    var existingAPI = _.find(apis, 'name', apiName.toString());
    if (existingAPI) {
      return BPromise.reject(new errors.RepeatedAPINameError(
          existingAPI.id, apiName));
    }

    return BPromise.resolve();
  }

  function checkAPIVersionNameIsNotUsed(apis, apiId, versionName) {
    if (addingAPIVersion(apiId)) {
      var api = _.find(apis, 'id', apiId);
      var existingVersion = _.find(api.versions, 'name', versionName.toString());
      if (existingVersion) {
        return BPromise.reject(new errors.RepeatedAPIVersionNameError(
            existingVersion.id, versionName));
      }
    }

    return BPromise.resolve();

    function addingAPIVersion(apiId) {
      return !!apiId;
    }
  }
};
