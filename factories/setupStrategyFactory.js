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
      getSubOrg: function (subOrgs) {
        return commandPrompt.getChoice('Select your sub-organization', 'name', 'id', subOrgs);
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
      getSubOrg: function (subOrgs) {
        var subOrg = _.find(subOrgs, 'id', parameters.subOrg);
        return subOrg ? Promise.resolve(subOrg) : Promise.reject(messages.notFound('Sub-Organization'));
      },
      getAPI: function (apis) {
        var api = _.find(apis, 'id', parameters.apiId);
        return api ? Promise.resolve(api) : Promise.reject(messages.notFound('API'));
      },
      getAPIVersion: function (api) {
        var apiVersion = _.find(api.versions, 'id', parameters.apiVersionId);
        return apiVersion ? Promise.resolve(apiVersion) : Promise.reject(messages.notFound('API Version'));
      }
    };
  }
};
