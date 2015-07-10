'use strict';

module.exports = function (localService) {
  return {
    status: status,
    conflicts: conflicts
  };

  function status() {
    return localService.getStatus();
  }

  function conflicts() {
    return localService.getConflicts();
  }
};
