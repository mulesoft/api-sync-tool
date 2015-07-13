'use strict';

module.exports = function (authenticationRepository, BPromise,
    workspaceRepository) {
  return {
    cleanup: cleanup
  };

  function cleanup() {
    return BPromise.all([
      workspaceRepository.del(),
      authenticationRepository.del()
    ]);
  }
};
