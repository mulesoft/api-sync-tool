'use strict';

var _ = require('lodash');

module.exports = function (BPromise, inquirer) {
  return {
    getChoice: getChoice,
    getRawChoice: getRawChoice,
    getConfirmation: getConfirmation,
    getInput: getInput
  };

  function getChoice(message, name, value, rawOptions) {
    var options = _.map(rawOptions, function (option) {
      return {
        name: option[name],
        value: option[value]
      };
    });

    return getRawChoice(message, options)
      .then(function (answer) {
        return _.find(rawOptions, value, answer);
      });
  }

  function getRawChoice(message, choices) {
    if (choices.length > 9) {
      choices.push(new inquirer.Separator());
    }

    return new BPromise(function (resolve) {
      inquirer.prompt({
        type: 'list',
        name: 'answer',
        message: message,
        choices: choices
      }, function (answers) {
        return resolve(answers.answer);
      });
    });
  }

  function getConfirmation(message) {
    return new BPromise(function (resolve) {
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

  function getInput(message) {
    return new BPromise(function (resolve) {
      inquirer.prompt({
        type: 'input',
        name: 'input',
        message: message
      }, function (answer) {
        return resolve(answer.input);
      });
    });
  }
};
