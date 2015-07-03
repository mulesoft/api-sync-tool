'use strict';

var _ = require('lodash');

module.exports = function (logger, messages, pullController,
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

  function print(files) {
    if (_.isEmpty(files)) {
      logger.info(messages.emptyAPIPullmessage());
    } else {
      logger.info(messages.status({added: _.pluck(files, 'path')}));
    }
  }

  function execute() {
    return pullController.getAPIFiles()
      .then(print);
  }
};
