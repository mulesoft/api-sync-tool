'use strict';

var _ = require('lodash');

module.exports = function (apiPlatformService, userOrganizationService,
    workspaceRepository) {
  return {
    setup: setup
  };

  function setup(strategy) {
    var workspace;

    return workspaceRepository.get()
      .then(function (currentWorkspace) {
        workspace = currentWorkspace;

        return userOrganizationService.getBusinessGroups();
      })
      .then(sortByName)
      .then(strategy.getBusinessGroup)
      .then(function (bizGroup) {
        workspace.bizGroup = bizGroup;
        return apiPlatformService.getAllAPIs(bizGroup.id);
      })
      .then(strategy.getAPI)
      .then(function (api) {
        workspace.api = api;
        return api.versions;
      })
      .then(sortByName)
      .then(strategy.getAPIVersion)
      .then(function (apiVersion) {
        workspace.apiVersion = apiVersion;

        return workspaceRepository.update(workspace);
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

function sortByName(objects) {
  return _.sortBy(objects, 'name');
}
