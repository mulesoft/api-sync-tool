'use strict';

module.exports = function (workspaceRepository, errors) {
  return function validateSetupStrategy() {
    var workspace = workspaceRepository.get();
    if (workspace.bizGroup && workspace.api && workspace.apiVersion) {
      return Promise.resolve();
    } else {
      return Promise.reject(new errors.SetupNeededError());
    }
  };
};
