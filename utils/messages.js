'use strict';

var _ = require('lodash');
var colors = require('colors/safe');

var TOOL_NAME = 'api-sync';

module.exports = function (commands) {
  return {
    // Usage
    usage: function () {
      return 'Usage: ' + TOOL_NAME + ' <' + commands.join('|') + '>';
    },
    commandUsage: function (command, parameters, commandOptions) {
      var convertOption = function (option) {
        return option.length === 1 ? ('-' + option) : ('--' + option + '=' + option);
      };

      var convertOptions = function (options) {
        return _.map(options, function (option) {
          if (_.isArray(option)) {
            return convertOptions(option).join(' ');
          } else {
            return convertOption(option);
          }
        });
      };

      commandOptions = convertOptions(commandOptions);

      return 'Usage: ' + TOOL_NAME + ' ' + command +
        (parameters ? (' <' + parameters.join('> <') + '>') : '') +
        (commandOptions ? ' [' + commandOptions.join(' || ') + ']' : '');
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
        var filesChanged  = result[action] || [];
        var prefix        = actions[action].prefix;
        var message       = actions[action].message;
        var colorPrinter  = actions[action].color;

        filesChanged.forEach(function (file) {
          output.push(colorPrinter([prefix, file, message].join(' ')));
        });
      });

      return output.join('\n');
    },
    setupSuccessful: function (workspace) {
      return 'Current setup:\n- Business group: ' + workspace.bizGroup.name +
        '\n- API: ' + workspace.api.name + ' ' + workspace.apiVersion.name;
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
      output += colors.bold('> ' + TOOL_NAME + ' pull ' + firstApi.id + ' ' + lastVersion.id + '\n');

      return output;
    },
    // Errors
    setupNeeded: function () {
      return 'Please run setup before running other commands.';
    },
    notFound: function (object) {
      return object + ' was not found.';
    },
    unknown: function (commandName) {
      return 'Unknown command: ' + commandName + '\n' + this.usage();
    },
    noCommands: function () {
      return 'Missing command name.\n' + this.usage();
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
    },
    savingFileError: function () {
      return 'An unknown error happened when saving a file';
    }
  };
};
