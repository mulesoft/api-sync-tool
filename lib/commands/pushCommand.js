'use strict';

var _ = require('lodash');

module.exports = function (BPromise, logger, messages, pushController,
    validateSetupDoneStrategy) {
  return {
    getHelp: messages.pushDetailedHelp,
    parseArgs: parseArgs,
    validateSetup: validateSetupDoneStrategy,
    validateInput: validateInput,
    execute: execute
  };

  function parseArgs(args) {
    return {
      force: args.f
    };
  }

  function validateInput() {
    return BPromise.resolve();
  }

  function execute(args) {
    return (args && args.force ? pushController.forcePush()
        : pushController.push())
      .then(print);
  }

  function print(result) {
    if (_.isEmpty(_.flatten(_.values(result)))) {
      logger.info(messages.nothingPush());
    } else {
      logger.info(messages.status(result));
    }
  }
};
