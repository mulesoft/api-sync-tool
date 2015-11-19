'use strict';

module.exports = function (BPromise, localService) {
  return {
    status: status
  };

  function status() {
    return BPromise.props({
      status: localService.getStatus(),
      conflicts: localService.getConflicts()
    });
  }
};
