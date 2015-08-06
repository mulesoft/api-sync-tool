'use strict';

var _ = require('lodash');

module.exports = function (BPromise, commandPrompt, logger, messages, errors) {
  return {
    get: get
  };

  function get(parameters) {
    if (parameters.isInteractive) {
      return interactiveStrategy();
    } else {
      return batchStrategy(parameters);
    }
  }

  function interactiveStrategy() {
    return {
      getCreateAPIorAPIVersionChoice: function () {
        return commandPrompt.getChoice(messages.createAPIPromptMessage(),
            'text', 'value', [
              {
                text: 'API',
                value: true
              },
              {
                text: 'API Version',
                value: false
              }
            ])
          .get('value');
      },
      getBusinessGroup: function (businessGroups) {
        return commandPrompt.getChoice(messages.businessGroupPromptMessage(),
          'name', 'id', sortByName(businessGroups));
      },
      getAPI: function (apis) {
        return commandPrompt.getChoice(messages.apiPromptMessage(),
          'name', 'id', sortByName(apis));
      },
      getAPIName: function (apis) {
        var self = this;
        return commandPrompt.getInput(messages.apiNamePromptMessage())
          .then(toString)
          .tap(checkFieldIsNotEmpty)
          .tap(function (apiName) {
            return checkAPINameIsNotUsed(apis, apiName);
          })
          .catch(function (err) {
            if (err instanceof errors.RepeatedAPINameError ||
                err instanceof errors.EmptyFieldError) {
              logger.info(err.message);
              return self.getAPIName(apis);
            }

            return BPromise.reject(err);
          });
      },
      getAPIVersionName: function (apis, apiId) {
        var self = this;
        return commandPrompt.getInput(messages.apiVersionNamePromptMessage())
          .then(toString)
          .tap(checkFieldIsNotEmpty)
          .tap(function (versionName) {
            return checkAPIVersionNameIsNotUsed(apis, apiId, versionName);
          })
          .catch(function (err) {
            if (err instanceof errors.RepeatedAPIVersionNameError ||
                err instanceof errors.EmptyFieldError) {
              logger.info(err.message);
              return self.getAPIVersionName(apis, apiId);
            }

            return BPromise.reject(err);
          });
      },
      getRootRamlPath: function (filesPath) {
        return commandPrompt.getRawChoice(messages.rootRamlPathPromptMessage(),
          filesPath.sort());
      }
    };
  }

  function batchStrategy(parameters) {
    return {
      getCreateAPIorAPIVersionChoice: function () {
        return BPromise.resolve(!!parameters.apiName);
      },
      getBusinessGroup: function (businessGroups) {
        var businessGroup = _.find(businessGroups, 'id', parameters.bizGroup);
        return businessGroup ?
          BPromise.resolve(businessGroup) :
          BPromise.reject(new errors.ChoiceNotFoundError(
            messages.businessGroupDescription()));
      },
      getAPI: function (apis) {
        var api = _.find(apis, 'id', parameters.apiId);
        return api ?
          BPromise.resolve(api) :
          BPromise.reject(new errors.ChoiceNotFoundError(
            messages.apiDescription()));
      },
      getAPIName: function (apis) {
        return checkAPINameIsNotUsed(apis, parameters.apiName)
          .return(parameters.apiName);
      },
      getAPIVersionName: function (apis, apiId) {
        return checkAPIVersionNameIsNotUsed(apis, apiId, parameters.apiVersion)
          .return(parameters.apiVersion);
      },
      getRootRamlPath: function (filesPath) {
        var localRootRamlPath = '/' + parameters.rootRamlPath;
        var rootRamlExists = _.includes(filesPath, localRootRamlPath);
        return rootRamlExists ?
          BPromise.resolve(localRootRamlPath) :
          BPromise.reject(new errors.ChoiceNotFoundError(
            messages.rootRamlDescription()));
      }
    };
  }

  function toString(input) {
    return input.toString();
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

  function sortByName(objects) {
    return _.sortBy(objects, 'name');
  }
};
