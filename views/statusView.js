'use strict';

var messages = require('../messages');

module.exports = {
  parseInput: function (args) {
    return new Promise(function (resolve, reject) {
      return resolve();
    });
  },
  displayOutput: function (result) {
    console.log(messages.status(result));
  }
};
