'use strict';

module.exports = function (localService, validateSetupStrategy, logger, messages) {
  return {
    validateSetup: validateSetupStrategy,
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
    logger.info(messages.status(result));
  }

  function execute(args) {
    return parse(args)
      .then(localService.status)
      .then(print);
  }
};
