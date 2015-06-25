'use strict';

var util = require('util');

var BaseError = require('./BaseError');

module.exports = function (messages) {
  /**
   * Trying to use a context field that hasn't been set
   *
   * @param {String} field The field of context
   */
  var UndefinedContextFieldError = function (field) {
    this.message = messages.undefinedContextFieldError(field);
    BaseError.call(this, this.message);
  };

  util.inherits(UndefinedContextFieldError, BaseError);

  return UndefinedContextFieldError;
};
