'use strict';

module.exports = function (cleanupController, logger, messages,
    validateSetupStrategy) {
  return {
    validateSetup: validateSetupStrategy,
    validateInput: validateInput,
    execute: execute
  };

  function validateInput() {
    return Promise.resolve();
  }

  function print() {
    logger.info(messages.cleanup());
  }

  function execute() {
    return cleanupController.cleanup()
      .then(print);
  }
};
