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
    commandUsage: function (command, commandOptions) {
      var convertOption = function (option) {
        return option.name.length === 1 ?
          ('-' + option.name + ' (' + option.description + ')') :
          ('--' + option.name + '=(' + option.description + ')');
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
        (commandOptions ? ' [' + commandOptions.join('] [') + ']' : '');
    },
    // Command results
    status: function (result) {
      var output = [];
      var actionOrder  = ['added', 'changed', 'deleted', 'unchanged'];

      var actions = {
        added: {
          color:   colors.bold.green,
          prefix:  '+',
          message: 'new file'
        },
        changed: {
          color:   colors.yellow,
          prefix:  '*',
          message: 'updated'
        },
        deleted: {
          color:   colors.red,
          prefix:  '-',
          message: 'deleted'
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
    pushProgressNew: function () {
      return 'Pushing new files...';
    },
    pushProgressChanged: function () {
        return 'Pushing changed files...';
    },
    pushProgressDeleted: function () {
      return 'Pushing deleted files...';
    },
    nothingPush: function () {
      return 'Nothing to push';
    },
    interactiveDescription: function () {
      return 'Interactive Mode';
    },
    businessGroupDescription: function () {
      return 'Business group id';
    },
    apiDescription: function () {
      return 'API id';
    },
    apiVersionDescription: function () {
      return 'API version id';
    },
    runPullDescription: function () {
      return 'Run pull after setup (optional)';
    },
    businessGroupPromptMessage: function () {
      return 'Select your business group';
    },
    apiPromptMessage: function () {
      return 'Select your API';
    },
    apiVersionPromptMessage: function () {
      return 'Select your API Version';
    },
    runPullPromptMessage: function () {
      return 'Do you want to pull your API files now?';
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

      output += 'To pull content from ' + firstApi.name + ' API version ' +
        lastVersion.name + ', use:\n';
      output += colors.bold('> ' + TOOL_NAME + ' pull ' + firstApi.id + ' ' +
        lastVersion.id + '\n');

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
    },
    loginError: function (username) {
      return 'Login failed for user ' + username;
    },
    undefinedContextFieldError: function (field) {
      return 'Context field: ' + field + ' was not defined';
    }
  };
};
