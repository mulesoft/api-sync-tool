'use strict';

var util = require('util');

var BaseError = require('./BaseError');

module.exports = function (messages) {
  /**
   * The user input an nonexisting command
   *
   * @param {String} command The name of the command
   */
  var UnknownCommandError = function (command) {
    this.message = messages.unknown(command);
    BaseError.call(this, this.message);
  };

  util.inherits(UnknownCommandError, BaseError);

  return UnknownCommandError;
};
