'use strict';

module.exports = function (BPromise, errors, workspaceRepository) {
  return function validateSetupDoneStrategy() {
    return workspaceRepository.get()
      .then(function (workspace) {
        if (!workspace.bizGroup || !workspace.api || !workspace.apiVersion) {
          return BPromise.reject(new errors.SetupNeededError());
        }
      });
  };
};
