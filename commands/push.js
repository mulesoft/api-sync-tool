'use strict';

var fs = require('fs');
var path = require('path');
var _ = require('lodash');
var sha = require('sha');
var request = require('request');

var utils = require('../utils');
var messages = require('../messages');
var config = utils.getCurrentConfig();

function parseParameters(args) {
  return {
    id: args[1],
    versionId: args[2]
  };
}

module.exports = {
  execute: function (args) {
    return new Promise(function (resolve, reject) {
      if (args.length < 3) {
        reject(messages.pushUsage());
      }

      var api = parseParameters(args);

      var storedFiles = config.files;
      var files = fs.readdirSync(path.join(process.cwd()));
      var promises = [];

      files.forEach(function (file) {
        // Search file in storedFiles.
        var existingFile = _.find(storedFiles, 'name', file);
        // Remove file from stored list if it exists.
        storedFiles = _.filter(storedFiles, function (storedFile) {
          return file !== storedFile.name;
        });
        // File exists
        if (existingFile) {
          // If content has changed
          if (existingFile.hash !== sha.getSync(file)) {
            promises.push(updateFile(existingFile, api));
          } else {
            promises.push(Promise.resolve(messages.fileIgnored(file)));
          }
        } else {
          promises.push(createFile(file, api));
        }
      });

      storedFiles.forEach(function (storedFile) {
        promises.push(deleteFile(storedFile, api));
      });

      Promise.all(promises)
        .then(function (output) {
          return output.join('\n');
        })
        .then(resolve)
        .catch(reject);
    });
  }
};

function createFile(file, api) {
  return new Promise(function (resolve, reject) {
    var options = utils.getHeaders(config.authentication);
    options.body = JSON.stringify(utils.newFile(file, api));
    return request.post(utils.getApiPlatformBaseUrl() + '/apis/' + api.id + '/versions/' + api.versionId + '/files',
      options,
      function (err, response) {
        if (err) {
          return reject(messages.unexpected(err));
        }

        if (response.statusCode !== 201) {
          return reject(messages.remoteError(response.body));
        }

        return resolve(messages.fileCreated(file));
      });
  });
}

function updateFile(file, api) {
  return new Promise(function (resolve, reject) {
    file.data = fs.readFileSync(file.name, 'utf8');
    var options = utils.getHeaders(config.authentication);
    options.body = JSON.stringify(file);
    return request.put(utils.getApiPlatformBaseUrl() + '/apis/' + api.id + '/versions/' + api.versionId + '/files/' + file.id,
      options,
      function (err, response) {
        if (err) {
          return reject(messages.unexpected(err));
        }

        if (response.statusCode !== 200) {
          return reject(messages.remoteError(response.body));
        }

        return resolve(messages.fileUpdated(file.name));
      });
  });
}

function deleteFile(file, api) {
  return new Promise(function (resolve, reject) {
    request.del(utils.getApiPlatformBaseUrl() + '/apis/' + api.id + '/versions/' + api.versionId + '/files/' + file.id,
      utils.getHeaders(config.authentication),
      function (err, response) {
        if (err) {
          return reject(messages.unexpected(err));
        }

        if (response.statusCode !== 200) {
          return reject(messages.remoteError(response.body));
        }

        return resolve(messages.fileDeleted(file.name));
      });
  });
}
