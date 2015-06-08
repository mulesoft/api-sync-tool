'use strict';

module.exports = function (apiPlatformService, userOrganizationService, workspaceRepository) {
  return {
    setup: setup
  };

  function setup(strategy) {
    var workspace = workspaceRepository.get();
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

        workspaceRepository.update(workspace);
        return workspace;
      });
  }
};
