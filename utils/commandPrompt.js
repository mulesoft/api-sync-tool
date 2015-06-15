'use strict';

var inquirer = require('inquirer');
var _ = require('lodash');

module.exports = function () {
  return {
    getChoice: getChoice,
    getConfirmation: getConfirmation
  };

  function getChoice(message, name, value, rawOptions) {
    var options = _.map(rawOptions, function (option) {
      return {
        name: option[name],
        value: option[value]
      };
    });

    return new Promise(function (resolve) {
      inquirer.prompt({
        type: 'list',
        name: 'answer',
        message: message,
        choices: options
      }, function (answers) {
        return resolve(_.find(rawOptions, value, answers.answer));
      });
    });
  }

  function getConfirmation(message) {
    return new Promise(function (resolve) {
      inquirer.prompt({
        type: 'confirm',
        name: 'confirm',
        message: message,
        default: true
      }, function (answer) {
        return resolve(answer.confirm);
      });
    });
  }
};
