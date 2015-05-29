'use strict';

var _ = require('lodash');
var colors = require('colors');

module.exports = {
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

    _.forEach(result.added, function (file) {
      output.push(('+ ' + file.path + ' new file').bold.green);
    });

    _.forEach(result.deleted, function (file) {
      output.push(('- ' + file.path + ' deleted').red);
    });

    _.forEach(result.changed, function (file) {
      output.push(('* ' + file.path + ' updated').yellow);
    });

    _.forEach(result.unchanged, function (file) {
      output.push('  ' + file.path + ' has no changes');
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
    output += ('> api-sync pull ' + firstApi.id + ' ' + lastVersion.id + '\n').bold;

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
  }
};
