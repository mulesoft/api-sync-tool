'use strict';

var dependable = require('dependable');
var path = require('path');
var fs = require('fs');
var _ = require('lodash');

var COMMANDS_LOCATION = 'commands';

function createContainer() {
  var container = dependable.container();

  loadModules();
  loadNodeModules();

  // container itself that we need to have to
  // be able dynamically resolve route installers
  container.register('container', container);

  registerCommands();
  registerErrors();
  registerContext();

  return container;

  function loadModules() {
    var entries   = [
      'application.js',
      COMMANDS_LOCATION,
      'controllers',
      'factories',
      'repositories',
      'services',
      'strategies',
      'utils'
    ];

    // load each entry as a module or a directory
    // with a list of modules inside without recursion
    entries.forEach(function (entry) {
      container.load(path.join(__dirname, entry));
    });
  }

  function loadNodeModules() {
    var superagent = require('superagent');
    var fs = require('fs');
    var BPromise = require('bluebird');

    container.register('fs', {
      createReadStream: fs.createReadStream,
      createWriteStream: fs.createWriteStream,
      readdir: BPromise.promisify(fs.readdir),
      readFile: BPromise.promisify(fs.readFile),
      readFileSync: fs.readFileSync,
      stat: BPromise.promisify(fs.stat),
      unlink: BPromise.promisify(fs.unlink),
      writeFileSync: fs.writeFileSync
    });

    container.register('inquirer', function () {
      var inquirer = require('inquirer');
      // @HACK: Remove ? prefix from inquirer prompt.
      _.keys(inquirer.prompt.prompts).forEach(function (prompt) {
        inquirer.prompt.prompts[prompt].prototype.prefix = function (str) {
          return str;
        };
      });

      return inquirer;
    });

    container.register('BPromise', function () {
      return BPromise;
    });

    container.register('omelette', function () {
      return require('omelette');
    });

    container.register('osenv', function () {
      return require('osenv');
    });

    container.register('process', function () {
      return process;
    });

    container.register('sha', function () {
      var sha = require('sha');
      return {
        get: BPromise.promisify(sha.get)
      };
    });

    container.register('superagent', function () {
      return require('superagent-promise')(superagent, require('bluebird'));
    });

    container.register('superagentCallbacks', function () {
      return superagent;
    });

    container.register('unzip', function () {
      return require('unzip');
    });
  }

  function registerCommands() {
    // Get available commands from fs.
    // The idea behind this is to avoid
    // harcoding the available commands in the code.
    var commands = fs.readdirSync(
      path.join(path.resolve(__dirname), COMMANDS_LOCATION));

    container.register('commands', function () {
      return _.map(commands, function (command) {
        // Remove Command.js from command file names.
        return command.split('Command.')[0];
      });
    });
  }

  function registerErrors() {
    // Application error handling, load index.js
    var errors = require('./utils/errors');
    var BaseError = require('./utils/errors/BaseError');
    container.register('BaseError', BaseError);

    // Register the errors so we can use them like errors.Xerror
    errors = Object.keys(errors).reduce(function (acum, key) {
      acum[key] = container.resolve(errors[key]);
      return acum;
    }, {});

    container.register('errors', errors);
  }

  function registerContext() {
    // This is only valid in single threaded applications
    container.register('contextHolder', function (errors) {
      var context = {
        getToken: function () {
          // Not resolving the constructor makes the new return undefined
          // instead of the error
          throw new errors.UndefinedContextFieldError('token');
        },
        getDirectoryPath: function () {
          throw new errors.UndefinedContextFieldError('directoryPath');
        }
      };

      return {
        set: function (newContext) {
          context = newContext;
        },
        get: function () {
          return context;
        }
      };
    });
  }
}

module.exports = {
  createContainer: createContainer
};
