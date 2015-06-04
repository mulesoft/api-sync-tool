'use strict';

module.exports = function (localService, messages) {
  return {
    validateInput: validateInput,
    execute: execute
  };

  function validateInput() {
    return Promise.resolve();
  }

  function parse(args) {
    return Promise.resolve(args);
  }

  function print(result) {
    console.log(messages.status(result));
  }

  function execute(args) {
    return parse(args)
      .then(localService.status)
      .then(print);
  }
};
