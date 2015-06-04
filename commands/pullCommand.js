'use strict';

var _ = require('lodash');

module.exports = function (logger, messages, pullController) {
  return {
    validateInput: validateInput,
    execute: execute
  };

  function validateInput() {
    return Promise.resolve();
  }

  function print(files) {
    logger.info(_.map(files, 'name').join('\n'));
  }

  function execute() {
    return pullController.getAPIFiles()
      .then(print);
  }
};
