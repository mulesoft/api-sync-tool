'use strict';

var _ = require('lodash');

module.exports = function (logger, messages, pullController, validateSetupStrategy) {
  return {
    validateSetup: validateSetupStrategy,
    validateInput: validateInput,
    execute: execute
  };

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
