'use strict';

var _ = require('lodash');

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
    if (_.isEmpty(_.flatten(_.values(_.omit(result, 'unchanged'))))) {
      logger.info(messages.nothingStatus());
    } else {
      logger.info(messages.status(result));
    }
  }

  function execute() {
    return localService.status()
      .then(print);
  }
};
