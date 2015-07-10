'use strict';

var _ = require('lodash');
var BPromise = require('bluebird');

module.exports = function (statusController, logger, messages,
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

    if (_.isEmpty(_.flatten(_.values(_.omit(status, 'unchanged'))))) {
      logger.info(messages.nothingStatus());
    } else {
      logger.info(messages.statusAndConflicts(status, conflicts));
    }
  }

  function execute() {
    return BPromise.props({
        status: statusController.status(),
        conflicts: statusController.conflicts()
      })
      .then(print);
  }
};
