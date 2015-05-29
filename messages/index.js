'use strict';

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
  status: {
    new: function (fileName) {
      return ('+ ' + fileName + ' new file\n').bold.green;
    },
    changed: function (fileName) {
      return ('* ' + fileName + ' updated\n').yellow;
    },
    notChanged: function (fileName) {
      return '  ' + fileName + ' has no changes\n';
    },
    deleted: function (fileName) {
      return ('- ' + fileName + ' deleted\n').red;
    }
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
  remoteError: function (response) {
    return 'Remote Error: ' + JSON.parse(response).message + '\n' +
      'Status Code: ' + response.statusCode;
  }
};
