'use strict';

var request = require('request');

var utils = require('../utils');
var messages = require('../messages');

module.exports = {
  execute: function (args) {
    return new Promise(function (resolve, reject) {
      if (args.length < 3) {
        return reject(messages.loginUsage());
      }

      var qs = {
        grant_type: 'password',
        username: args._[1],
        password: args._[2],
        client_id: 'studio',
        client_secret: 'studio123'
      };

      request.post(utils.getLoginUrl(),
        {
          form: qs
        },
        function (err, response) {
          if (err) {
            return reject(messages.unexpected(err));
          }

          if (response.statusCode !== 200) {
            return reject(messages.badCredentials());
          }

          var config = utils.getCurrentConfig(true);
          if (!config) {
            config = {
              directory: process.cwd()
            };
          }

          config.authentication = JSON.parse(response.body);
          utils.writeConfigFile(config);

          return resolve(messages.loginSuccessful());
        });
    });
  }
};
