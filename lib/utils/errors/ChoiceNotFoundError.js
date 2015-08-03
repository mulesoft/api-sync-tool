'use strict';

var util = require('util');

module.exports = function (BaseError, messages) {
  /**
   * A value for a parameter in batch mode was wrong
   *
   * @param {String} parameter The parameter with wrong value
   */
  var ChoiceNotFoundError = function (parameter) {
    this.message = messages.notFound(parameter);
    BaseError.call(this, this.message);
  };

  util.inherits(ChoiceNotFoundError, BaseError);

  return ChoiceNotFoundError;
};
