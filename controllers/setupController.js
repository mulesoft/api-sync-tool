'use strict';

module.exports = function (apiPlatformService, userOrganizationService) {
  return {
    setup: setup
  };

  function setup(strategy) {
    var workspace = {};
    return userOrganizationService.getSubOrganizations()
      .then(strategy.getSubOrg)
      .then(function (subOrg) {
        workspace.subOrg = subOrg;
        return apiPlatformService.getAllAPIs(subOrg.id)
          .then(function (apis) {
            return apis;
          });
      })
      .then(strategy.getAPI)
      .then(function (api) {
        workspace.api = api;
        return api;
      })
      .then(strategy.getAPIVersion)
      .then(function (apiVersion) {
        workspace.apiVersion = apiVersion;
        return workspace;
      });
  }
};
