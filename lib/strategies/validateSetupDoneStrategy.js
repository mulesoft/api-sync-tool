'use strict';

var BPromise = require('bluebird');

module.exports = function (workspaceRepository, errors) {
  return function validateSetupDoneStrategy() {
    return workspaceRepository.get()
      .then(function (workspace) {
        if (!workspace.bizGroup || !workspace.api || !workspace.apiVersion) {
          return BPromise.reject(new errors.SetupNeededError());
        }
      });
  };
};
