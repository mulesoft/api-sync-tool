'use strict';

var _ = require('lodash');

module.exports = function (logger, messages, pushController) {
  return {
    validateInput: validateInput,
    execute: execute
  };

  function validateInput() {
      return Promise.resolve();
    }

  function execute() {
    return pushController.push()
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
