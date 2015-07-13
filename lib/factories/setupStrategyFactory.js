'use strict';

var _ = require('lodash');

module.exports = function (BPromise, commandPrompt, messages, errors) {
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
      getBusinessGroup: function (businessGroups) {
        return commandPrompt.getChoice(messages.businessGroupPromptMessage(),
          'name', 'id', businessGroups);
      },
      getAPI: function (apis) {
        return commandPrompt.getChoice(messages.apiPromptMessage(),
          'name', 'id', apis);
      },
      getAPIVersion: function (apiVersions) {
        return commandPrompt.getChoice(messages.apiVersionPromptMessage(),
          'name', 'id', apiVersions);
      },
      getRunPull: function () {
        return commandPrompt.getConfirmation(messages.runPullPromptMessage());
      }
    };
  }

  function batchStrategy(parameters) {
    return {
      getBusinessGroup: function (businessGroups) {
        var businessGroup = _.find(businessGroups, 'id', parameters.bizGroup);
        return businessGroup ?
          BPromise.resolve(businessGroup) :
          BPromise.reject(new errors.ChoiceNotFoundError(
            messages.businessGroupDescription()));
      },
      getAPI: function (apis) {
        var api = _.find(apis, 'id', parameters.api);
        return api ?
          BPromise.resolve(api) :
          BPromise.reject(new errors.ChoiceNotFoundError(
            messages.apiDescription()));
      },
      getAPIVersion: function (apiVersions) {
        var apiVersion = _.find(apiVersions, 'id', parameters.apiVersion);
        return apiVersion ?
          BPromise.resolve(apiVersion) :
          BPromise.reject(new errors.ChoiceNotFoundError(
            messages.apiVersionDescription()));
      },
      getRunPull: function () {
        return BPromise.resolve(parameters.runPull);
      }
    };
  }
};
