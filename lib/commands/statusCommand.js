'use strict';

module.exports = function (localService, logger, messages,
    validateSetupStrategy) {
  return {
    validateSetup: validateSetupStrategy,
    validateInput: validateInput,
    execute: execute
  };

  function validateInput() {
    return Promise.resolve();
  }

  function print(result) {
    logger.info(messages.status(result));
  }

  function execute() {
    return localService.status()
      .then(print);
  }
};
