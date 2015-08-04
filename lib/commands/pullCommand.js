'use strict';

var _ = require('lodash');

module.exports = function (BPromise, logger, messages, pullController,
    validateSetupDoneStrategy) {
  return {
    getHelp: messages.pullDetailedHelp,
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
    if (_.isEmpty(result.files) && _.isEmpty(result.directories)) {
      logger.info(messages.emptyAPIPullmessage());
    } else {
      logger.info(messages.status({
        addedDirectories: _.pluck(result.directories, 'path').sort(),
        added: _.pluck(result.files, 'path').sort()
      }));
    }
  }

  function execute() {
    return pullController.getAPIFiles()
      .then(print);
  }
};
