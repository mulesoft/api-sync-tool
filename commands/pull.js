'use strict';

var request = require('request');
var zlib = require('zlib');
var fs = require('fs');
var path = require('path');
var sha = require('sha');

var utils = require('../utils');
var config = utils.getCurrentConfig();

module.exports = {
  execute: function (args) {
    return new Promise(function (resolve, reject) {
      if (args.length < 3) {
        return reject('Usage: apy-sync pull <apiId> <versionId>');
      }

      var api = parseParameters(args);
      config.files = [];
      var promises = [];

      request.get(utils.getApiPlatformBaseUrl() + '/apis/' + api.id + '/versions/' + api.versionId + '/files',
        utils.getHeaders(config.authentication),
        function (err, response) {
          var files = JSON.parse(response.body);

          files.forEach(function (file) {
            promises.push(new Promise(function (resolve, reject) {
              request.get(utils.getApiPlatformBaseUrl() + '/apis/' + api.id + '/versions/' + api.versionId + '/files/' + file.id,
                utils.getHeaders(config.authentication),
                function (err, innerResponse) {
                  if (err) {
                    reject('Unexpected error: ' + err);
                  }
                  var fileData = JSON.parse(innerResponse.body).data;
                  fs.writeFileSync(path.join(process.cwd(), file.name), fileData);

                  file.hash = sha.getSync(file.name);
                  config.files.push(file);

                  return resolve(file.name);
                });
            }));
          });

          Promise.all(promises)
            .then(function (output) {
              utils.writeConfigFile(config);

              return output.join('\n');
            })
            .then(resolve)
            .catch(reject);
        });
    });
  }
};

function parseParameters(args) {
  return {
    id: args[1],
    versionId: args[2]
  };
}
