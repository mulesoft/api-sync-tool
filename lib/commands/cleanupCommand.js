'use strict';

var BPromise = require('bluebird');

module.exports = function (cleanupController, logger, messages) {
  return {
    parseArgs: parseArgs,
    validateSetup: validateSetup,
    validateInput: validateInput,
    execute: execute
  };

  function parseArgs() {
    return BPromise.resolve();
  }

  function validateInput() {
    return BPromise.resolve();
  }

  function validateSetup() {
    return BPromise.resolve();
  }

  function print() {
    logger.info(messages.cleanup());
  }

  function execute() {
    return cleanupController.cleanup()
      .then(print);
  }
};
