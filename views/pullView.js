'use strict';

var _ = require('lodash');

var messages = require('../messages');

module.exports = {
  parseInput: function (args) {
    return new Promise(function (resolve, reject) {
      if (args._.length < 3) {
        return reject(new Error('Wrong param number in pull'));
      }

      return resolve({
        id: args._[1],
        versionId: args._[2]
      });
    });
  },
  displayOutput: function (files) {
    console.log(_.map(files, 'name').join('\n'));
  }
};
