'use strict';

var _ = require('lodash');

module.exports = function (commandPrompt, messages) {
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
        return commandPrompt.getChoice(messages.businessGroupPromptMessage(), 'name', 'id', businessGroups);
      },
      getAPI: function (apis) {
        return commandPrompt.getChoice(messages.apiPromptMessage(), 'name', 'id', apis);
      },
      getAPIVersion: function (api) {
        return commandPrompt.getChoice(messages.apiVersionPromptMessage(), 'name', 'id', api.versions);
      }
    };
  }

  function batchStrategy(parameters) {
    return {
      getBusinessGroup: function (businessGroups) {
        var businessGroup = _.find(businessGroups, 'id', parameters.bizGroup);
        return businessGroup ? Promise.resolve(businessGroup) : Promise.reject(messages.notFound(messages.businessGroupDescription()));
      },
      getAPI: function (apis) {
        var api = _.find(apis, 'id', parameters.api);
        return api ? Promise.resolve(api) : Promise.reject(messages.notFound(messages.apiDescription()));
      },
      getAPIVersion: function (api) {
        var apiVersion = _.find(api.versions, 'id', parameters.apiVersion);
        return apiVersion ? Promise.resolve(apiVersion) : Promise.reject(messages.notFound(messages.apiVersionDescription()));
      }
    };
  }
};
