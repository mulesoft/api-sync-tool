'use strict';

module.exports = function (apiPlatformService, userOrganizationService, workspaceRepository) {
  return {
    setup: setup
  };

  function setup(strategy) {
    var workspace = workspaceRepository.get();
    return userOrganizationService.getBusinessGroups()
      .then(strategy.getBusinessGroup)
      .then(function (bizGroup) {
        workspace.bizGroup = bizGroup;
        return apiPlatformService.getAllAPIs(bizGroup.id)
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
      })
      .then(strategy.getRunPull)
      .then(function (runPull) {
        return {
          workspace: workspace,
          runPull: runPull
        };
      });
  }
};
