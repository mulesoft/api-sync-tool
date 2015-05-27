'use strict';

var request = require('request');
var colors = require('colors');

var utils = require('../utils');
var config = utils.getCurrentConfig();

module.exports = {
  execute: function (args) {
    return new Promise(function (resolve, reject) {
      request.get(utils.getApiPlatformBaseUrl() + '/apis',
        utils.getHeaders(config.authentication),
        function (err, response) {
          if (err) {
            return reject('Unexpected Error: ' + err);
          }

          if (response.statusCode !== 200) {
            return reject('Please login again ' + response.body);
          }

          var apis = [];
          var output = "";

          var responseJson = JSON.parse(response.body);
          responseJson.apis.forEach(function (api) {
            var anApi = {
              id: api.id,
              name: api.name,
              versions: []
            };
            output += '+ ID: ' + api.id + ' Name: ' + api.name + '\n';
            output += '  Versions:\n';
            api.versions.forEach(function (version) {
              output += '    - Version ID: ' + version.id + ' Name: ' + version.name + '\n';
              anApi.versions.push({
                id: version.id,
                name: version.name
              });
            });

            apis.push(anApi);

            output += '\n';
          });

          var firstApi = apis[0];
          var lastVersion = firstApi.versions[apis[0].versions.length - 1];

          output += 'To pull content from ' + firstApi.name + ' API version ' + lastVersion.name + ', use:\n';
          output += ('> api-sync pull ' + firstApi.id + ' ' + lastVersion.id + '\n').bold;

          return resolve(output);
        });
    });
  }
};
