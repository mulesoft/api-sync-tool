'use strict';

var messages = require('../messages');

module.exports = {
  parseInput: function (args) {
    return new Promise(function (resolve, reject) {
      if (args._.length < 3) {
        return reject(new Error('Wrong param number in login'));
      }

      return resolve({
        name: args._[1],
        password: args._[2]
      });
    });
  },
  displayOutput: function () {
    console.log(messages.loginSuccessful());
  }
};
