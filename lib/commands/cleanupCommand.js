'use strict';

module.exports = function (cleanupController, logger, messages,
    validateSetupDoneStrategy) {
  return {
    parseArgs: parseArgs,
    validateSetup: validateSetupDoneStrategy,
    validateInput: validateInput,
    execute: execute
  };

  function parseArgs() {
    return Promise.resolve();
  }

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
