'use strict';

module.exports = function () {
  return {
    execute: push
  };

  function push() {
    return Promise.reject('Implement me');
  }
};
