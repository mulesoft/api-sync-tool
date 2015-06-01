'use strict';

var messages = require('../messages');

module.exports = {
  parseInput: function (args) {
    return new Promise(function (resolve, reject) {
      return resolve();
    });
  },
  displayOutput: function (apis) {
    console.log(messages.apis(apis));
  }
};
