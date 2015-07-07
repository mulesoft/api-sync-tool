'use strict';

var _ = require('lodash');
var BPromise = require('bluebird');

module.exports = function (logger, messages, pullController,
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
