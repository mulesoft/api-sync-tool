'use strict';

var BPromise = require('bluebird');

module.exports = function (authenticationRepository, workspaceRepository) {
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
