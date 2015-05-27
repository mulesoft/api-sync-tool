'use strict';

var request = require('request');

var utils = require('../utils');

module.exports = {
  execute: function (args) {
    return new Promise(function (resolve, reject) {
      if (args.length < 3) {
        return reject('Usage: api-sync login <username> <password>');
      }

      var qs = {
        grant_type: 'password',
        username: args[1],
        password: args[2],
        client_id: 'studio',
        client_secret: 'studio123'
      };

      request.post(utils.getLoginUrl(),
        {
          form: qs
        },
        function (err, response) {
          if (err) {
            return reject('Unexpected Error: ' + err);
          }

          if (response.statusCode !== 200) {
            return reject('Bad credentials');
          }

          var config = utils.getCurrentConfig(true);

          if (!config) {
            config = {
              directory: process.cwd()
            };
          }

          config.authentication = JSON.parse(response.body);
          utils.writeConfigFile(config);

          return resolve('Login successful');
        });
    });
  }
};
