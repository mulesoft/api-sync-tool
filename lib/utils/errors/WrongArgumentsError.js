'use strict';

var util = require('util');

module.exports = function (BaseError, messages) {
  /**
   * The user input the wrong parameters for the command
   *
   * @param {String} command The command the user input
   * @param {Object} commandOptions The options that can be passed
   *   to the command
   */
  var WrongArgumentsError = function (command, commandOptions) {
    this.message = messages.commandUsage(command, commandOptions);
    BaseError.call(this, this.message);
  };

  util.inherits(WrongArgumentsError, BaseError);

  return WrongArgumentsError;
};
