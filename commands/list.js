'use strict';

var request = require('request');
var colors = require('colors');

var utils = require('../utils');
var messages = require('../messages');
var config = utils.getCurrentConfig();

module.exports = {
  execute: function (args) {
    return new Promise(function (resolve, reject) {
      request.get(utils.getApiPlatformBaseUrl() + '/apis',
        utils.getHeaders(config.authentication),
        function (err, response) {
          if (err) {
            return reject(messages.unexpected(err));
          }

          if (response.statusCode !== 200) {
            return reject(messages.remoteError(response.body));
          }

          var apis = [];

          var responseJson = JSON.parse(response.body);
          responseJson.apis.forEach(function (api) {
            var anApi = {
              id: api.id,
              name: api.name,
              versions: []
            };

            api.versions.forEach(function (version) {
              anApi.versions.push({
                id: version.id,
                name: version.name
              });
            });

            apis.push(anApi);
          });

          return resolve(messages.apis(apis));
        });
    });
  }
};
