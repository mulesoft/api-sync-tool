'use strict';

var _ = require('lodash');
var colors = require('colors/safe');

module.exports = function () {
  return {
    // Usage
    usage: function (commands) {
      return 'Usage: api-sync <' + commands.join('|') + '>';
    },
    loginUsage: function () {
      return 'Usage: api-sync login <username> <password>';
    },
    pushUsage: function () {
      return 'Usage: apy-sync push <apiId> <versionId>';
    },
    pullUsage: function () {
      return 'Usage: apy-sync pull <apiId> <versionId>';
    },
    // Command results
    status: function (result) {
      var output = [];
      var actionOrder  = ['added', 'deleted', 'changed', 'unchanged'];

      var actions = {
        added: {
          color:   colors.bold.green,
          prefix:  '+',
          message: 'new file'
        },
        deleted: {
          color:   colors.red,
          prefix:  '-',
          message: 'deleted'
        },
        changed: {
          color:   colors.yellow,
          prefix:  '*',
          message: 'updated'

        },
        unchanged: {
          color: function (msg) {
              return msg;
          },
          prefix:  ' ',
          message: 'has no changes'
        }
      };

      actionOrder.forEach(function (action) {
        var filesChanged  = result[action];
        var prefix        = actions[action].prefix;
        var message       = actions[action].message;
        var colorPrinter  = actions[action].color;

        filesChanged.forEach(function (file) {
          output.push(colorPrinter([prefix, file.path, message].join(' ')));
        });
      });

      return output.join('\n');
    },
    loginSuccessful: function () {
      return 'Login successful';
    },
    fileIgnored: function (fileName) {
      return fileName + ' has not changed, ignoring.';
    },
    fileCreated: function (fileName) {
      return 'Created: ' + fileName;
    },
    fileUpdated: function (fileName) {
      return 'Updated: ' + fileName;
    },
    fileDeleted: function (fileName) {
      return 'Deleted: ' + fileName;
    },
    apis: function (apis) {
      var output = '';
      apis.forEach(function (api) {
        output += '+ ID: ' + api.id + ' Name: ' + api.name + '\n';
        output += '  Versions:\n';

        api.versions.forEach(function (version) {
          output += '    - Version ID: ' + version.id + ' Name: ' + version.name + '\n';
        });
      });

      var firstApi = apis[0];
      var lastVersion = firstApi.versions[apis[0].versions.length - 1];

      output += 'To pull content from ' + firstApi.name + ' API version ' + lastVersion.name + ', use:\n';
      output += colors.bold('> api-sync pull ' + firstApi.id + ' ' + lastVersion.id + '\n');

      return output;
    },
    // Errors
    unknown: function (commandName, commands) {
      return 'Unknown command: ' + commandName + '\n' + this.usage(commands);
    },
    noCommands: function (commands) {
      return 'Error: Missing command name.\n' + this.usage(commands);
    },
    unexpected: function (err) {
      return 'Unexpected Error: ' + err;
    },
    badCredentials: function () {
      return 'Bad credentials';
    },
    remoteError: function (responseBody, statusCode) {
      return 'Remote Error: ' + JSON.parse(responseBody).message + '\n' +
        'Status Code: ' + statusCode;
    },
    invalidDirectory: function () {
      return 'Invalid directory';
    }
  };
};
