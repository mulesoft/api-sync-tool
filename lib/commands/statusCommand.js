'use strict';

var _ = require('lodash');
var BPromise = require('bluebird');

module.exports = function (localService, logger, messages,
    validateSetupDoneStrategy) {
  return {
    getHelp: messages.statusDetailedHelp,
    parseArgs: parseArgs,
    validateSetup: validateSetupDoneStrategy,
    validateInput: validateInput,
    execute: execute
  };

  function parseArgs() {
    return BPromise.resolve();
  }

  function validateInput() {
    return BPromise.resolve();
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
