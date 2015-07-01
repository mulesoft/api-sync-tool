'use strict';

var _ = require('lodash');
var colors = require('colors/safe');

var TOOL_NAME = 'api-sync';

module.exports = function () {
  return {
    generalUsage: function () {
      return 'Usage:\n' +
        '  first choose an API: \n' +
        '    ' + TOOL_NAME + ' setup   an interactive wizard\n' +
        '  or if you know your API details\n' +
        '    ' + TOOL_NAME + ' setup --bizGroup=(Business group id) --api=(API id) --apiVersion=(API version id) -p (Run pull after setup)\n\n' +
        '  then\n' +
        '    ' + TOOL_NAME + ' pull    ' + this.pullHelp() + '\n' +
        '    ' + TOOL_NAME + ' push    ' + this.pushHelp() + '\n' +
        '    ' + TOOL_NAME + ' status  ' + this.statusHelp() + '\n' +
        '  ' + this.helpParameter();
    },
    pullHelp: function () {
      return 'download the files from API Platform';
    },
    pushHelp: function () {
      return 'upload your files to API Platform';
    },
    statusHelp: function () {
      return 'show the files status';
    },
    helpParameter: function () {
      return 'for a detailed description of a command, add /?';
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
    cleanup: function () {
      return 'Cleanup successful';
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
    expiredTokenMessage: function () {
      return 'Your credentials have expired, please login again.';
    },
    loginPromptMessage: function () {
      return 'Enter your Anypoint Platform username and password';
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
    storeAuthenticationPromptMessage: function () {
      return 'Do you want to stay logged in? ' +
        '(More info in http://bit.ly/1BDMOXB)';
    },
    runPullPromptMessage: function () {
      return 'Do you want to pull your API definition files now?';
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
    emptyAPIPullmessage: function () {
      return 'The API is empty';
    },
    downloadingAPI: function () {
      return 'Downloading the API definition files...';
    },
    finishedDownloadingAPI: function () {
      return 'API definition files download finished';
    },
    // Errors
    setupNeeded: function () {
      return 'Please run setup before running other commands.';
    },
    notFound: function (object) {
      return object + ' was not found.';
    },
    unknown: function (commandName) {
      return 'Unknown command: ' + commandName + '\n' + this.generalUsage();
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
    saveFileError: function () {
      return 'An unknown error happened when saving a file';
    },
    downloadFileError: function () {
      return 'An unknown error happened when downloading a file';
    },
    authFileNotFound: function () {
      return 'Authentication file not found.';
    },
    loginError: function (username) {
      return 'Login failed for user ' + username;
    },
    badCredentialsError: function () {
      return 'Bad credentials, please login again.';
    },
    undefinedContextFieldError: function (field) {
      return 'Context field: ' + field + ' was not defined';
    },
    setupAlreadyDoneError: function (bizGroupName, apiName, apiVersionName) {
      return 'This folder has the following setup \n' +
        'bussinesGroup: ' + bizGroupName + '\n' +
        'api: ' + apiName + '\n' +
        'version: ' + apiVersionName;
    },
    decompressError: function (filePath, error) {
      return 'There was an error decompressing ' + filePath + '\n' + error;
    }
  };
};
