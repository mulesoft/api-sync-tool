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
        return commandPrompt.getChoice('Select your business group', 'name', 'id', businessGroups);
      },
      getAPI: function (apis) {
        return commandPrompt.getChoice('Select your API', 'name', 'id', apis);
      },
      getAPIVersion: function (api) {
        return commandPrompt.getChoice('Select your API Version', 'name', 'id', api.versions);
      }
    };
  }

  function batchStrategy(parameters) {
    return {
      getBusinessGroup: function (businessGroups) {
        var businessGroup = _.find(businessGroups, 'id', parameters.bizGroup);
        return businessGroup ? Promise.resolve(businessGroup) : Promise.reject(messages.notFound('Business Group'));
      },
      getAPI: function (apis) {
        var api = _.find(apis, 'name', parameters.api);
        return api ? Promise.resolve(api) : Promise.reject(messages.notFound('API'));
      },
      getAPIVersion: function (api) {
        var apiVersion = _.find(api.versions, 'name', parameters.apiVersion);
        return apiVersion ? Promise.resolve(apiVersion) : Promise.reject(messages.notFound('API Version'));
      }
    };
  }
};
