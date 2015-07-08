'use strict';

var _ = require('lodash');
var colors = require('colors/safe');

var TOOL_NAME = 'api-sync';
var requiresSetup = 'Requires setup: Do it with ' + TOOL_NAME +
  ' setup, or ' + TOOL_NAME + ' create\n';
var createBatchMode = TOOL_NAME + ' create --bizGroup=(Business group id) ' +
  '(--apiName=(API name)|--apiId=(API id)) --apiVersion=(API version name) ' +
  '--rootRaml=(rootRaml path, must be in the root directory)';
var setupBatchMode = TOOL_NAME + ' setup --bizGroup=(Business group id) ' +
  '--api=(API id) --apiVersion=(API version id) -p (Run pull after setup)';
var setupInteractiveMode = TOOL_NAME + ' setup    for an interactive wizard';

module.exports = function () {
  return {
    generalUsage: function () {
      return 'Usage:\n' +
        '  first choose an API: \n' +
        '    ' + setupInteractiveMode + '\n' +
        '  or if you know your API details\n' +
        '    ' + setupBatchMode + '\n\n' +
        '  or if you want to create a new API and upload files\n' +
        '    ' + createBatchMode + '\n\n' +
        '  then\n' +
        // TODO: this information should be pulled dynamically from existing
        // commands.
        '    ' + TOOL_NAME + ' pull     ' + this.pullHelp() + '\n' +
        '    ' + TOOL_NAME + ' push     ' + this.pushHelp() + '\n' +
        '    ' + TOOL_NAME + ' cleanup  ' + this.cleanupHelp() + '\n' +
        '    ' + TOOL_NAME + ' status   ' + this.statusHelp() + '\n' +
        '  ' + this.helpParameter() + '\n';
    },
    pullHelp: function () {
      return 'download the files from API Platform';
    },
    pushHelp: function () {
      return 'upload your files to API Platform';
    },
    cleanupHelp: cleanupHelp,
    statusHelp: function () {
      return 'show the files status';
    },
    helpParameter: function () {
      return 'for a detailed description of a command, use it with --help';
    },
    cleanupDetailedHelp: function () {
      return cleanupHelp() +
        '\nAfter cleanup only create and setup commands can be used\n\n' +
        requiresSetup;
    },
    createDetailedHelp: function () {
      return 'Creates a new API or a new version for an existing API, ' +
      'synchronizes the folder with it and uploads it\'s files.\n' +
      'User must provide the root RAML path, this file must be in the root ' +
      'level of the directory\n\n  ' + createBatchMode + '\n';
    },
    pullDetailedHelp: function () {
      return 'Download the API definition files from API Platform:\n' +
        'Overwrites existing files in your folder\n\n' + requiresSetup;
    },
    pushDetailedHelp: function () {
      return 'Updates API Platform with your changes:\nUploads new files\n' +
        'Overwrites changed files\nRemoves files deleted locally\n\n' +
        requiresSetup;
    },
    setupDetailedHelp: function () {
      return 'Synchronizes the folder with an API Platform API definition\n\n' +
        '  ' + setupInteractiveMode + '\n' + '  ' + setupBatchMode + '\n';
    },
    statusDetailedHelp: function () {
      return 'Prints which files have changed in the folder\n\n' + requiresSetup;
    },
    commandUsage: function (command, commandOptions) {
      commandOptions = convertOptions(commandOptions);

      return 'Usage: ' + TOOL_NAME + ' ' + command +
        (commandOptions ? ' [' + commandOptions.join('] [') + ']' : '');

      function convertOptions(options) {
        return _.map(options, function (option) {
          if (_.isArray(option)) {
            return convertOptions(option).join(' ');
          } else {
            return convertOption(option);
          }
        });
      }

      function convertOption(option) {
        if (option.type === 'xor') {
          return '(' + option.options.map(convertOption).join('|') + ')';
        }
        return option.name.length === 1 ?
          ('-' + option.name + ' (' + option.description + ')') :
          ('--' + option.name + '=(' + option.description + ')');
      }
    },
    // Command results
    status: function (result) {
      var actions = [
        {
          name: 'addedDirectories',
          options: {
            color:   colors.bold.green,
            prefix:  '+',
            message: 'new directory'
          }
        },
        {
          name: 'added',
          options: {
            color:   colors.bold.green,
            prefix:  '+',
            message: 'new file'
          }
        },
        {
          name: 'changed',
          options: {
            color:   colors.yellow,
            prefix:  '*',
            message: 'updated'
          }
        },
        {
          name: 'deleted',
          options: {
            color:   colors.red,
            prefix:  '-',
            message: 'deleted'
          }
        }
      ];

      return buildStatusResponse(result, actions);
    },
    statusAndConflicts: function (status, conflicts) {
      var output = this.status(status);
      if (!_.isEmpty(_.flatten(_.values(conflicts)))) {
        output += '\n\n' + colors.yellow(this.conflictsFound(conflicts));
      }

      return output;
    },
    conflictsFound: function (conflicts) {
      var actions = [
        {
          name: 'addedAlreadyExists',
          options: {
            color: colors.bold.green,
            prefix: ' ',
            message: 'exists in the remote server'
          }
        },
        {
          name: 'changedWasDeleted',
          options: {
            color: colors.yellow,
            prefix: ' ',
            message: 'was deleted in the remote server'
          }
        },
        {
          name: 'changedRemotely',
          options: {
            color: colors.yellow,
            prefix: ' ',
            message: 'was updated in the remote server'
          }
        },
        {
          name: 'deletedNotExists',
          options: {
            color: colors.red,
            prefix: ' ',
            message: 'does not exist in the remote server'
          }
        }
      ];

      var output = 'Conflicts found:\n\n';
      output += buildStatusResponse(conflicts, actions);
      output += '\n\nTo resolve run:\n';
      output += '- ' + TOOL_NAME + ' pull (overwrites local changes)\n';
      output += '- ' + TOOL_NAME + ' push -f (deletes remote API definition ' +
        'files and replaces them with the local ones)';
      return output;
    },
    creatingAPI: function () {
      return 'Creating API';
    },
    settingEnvironment: function () {
      return 'Setting the environment';
    },
    newDirectoriesEmpty: function () {
      return 'New directories will be created empty. Files will be added next';
    },
    creatingDirectory: function (newDirectoryPath) {
      return 'Creating directory: ' + newDirectoryPath;
    },
    uploadingFile: function (filePath) {
      return 'Uploading: ' + filePath;
    },
    deletingFile: function (filePath) {
      return 'Deleting: ' + filePath;
    },
    apiCreated: function () {
      return 'API created';
    },
    apiVersionCreated: function () {
      return 'API version created';
    },
    uploadingRootRaml: function () {
      return 'Uploading the root RAML';
    },
    rootRamlUploaded: function (rootRamlPath) {
      return 'Root raml: ' + rootRamlPath + ' uploaded';
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
    nothingStatus: function () {
      return 'Nothing has changed';
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
    apiNameDescription: function () {
      return 'API name';
    },
    apiVersionNameDescription: function () {
      return 'API version name';
    },
    rootRamlDescription: function () {
      return 'API root RAML path';
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
          output += '    - Version ID: ' + version.id +
            ' Name: ' + version.name + '\n';
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

  function cleanupHelp() {
    return 'deletes all metadata for current directory. This include login ' +
      'information and setup configuration.';
  }

  function buildStatusResponse(statusCollection, actions) {
    var output = [];
    actions.forEach(function (action) {
      var filesChanged  = statusCollection[action.name] || [];
      var prefix        = action.options.prefix;
      var message       = action.options.message;
      var colorPrinter  = action.options.color;

      filesChanged.forEach(function (file) {
        output.push(colorPrinter([prefix, file, message].join(' ')));
      });
    });

    return output.join('\n');
  }
};
