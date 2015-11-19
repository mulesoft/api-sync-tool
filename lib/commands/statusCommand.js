'use strict';

var _ = require('lodash');

module.exports = function (BPromise, logger, messages, statusController,
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
    var status = result.status;
    var conflicts = result.conflicts;

    if (_.isEmpty(_.flatten(_.values(_.omit(status, 'unchanged')))) &&
        _.isEmpty(_.flatten(_.values(conflicts)))) {
      logger.info(messages.nothingStatus());
    } else {
      logger.info(messages.statusAndConflicts(status, conflicts));
    }
  }

  function execute() {
    return statusController.status()
      .then(print);
  }
};
