'use strict';

var dependable = require('dependable');
var path = require('path');
var fs = require('fs');
var _ = require('lodash');

var COMMANDS_LOCATION = 'commands';

function createContainer() {
  var container = dependable.container();
  var entries   = [
    'application.js',
    COMMANDS_LOCATION,
    'controllers',
    'factories',
    'repositories',
    'services',
    'utils'
  ];

  // load each entry as a module or a directory
  // with a list of modules inside without recursion
  entries.forEach(function (entry) {
    container.load(path.join(__dirname, entry));
  });

  // node_modules
  container.register('superagent', function superagent() {
    return require('superagent-promise');
  });

  // Register console as module.
  container.register('console', console);

  // container itself that we need to have to
  // be able dynamically resolve route installers
  container.register('container', container);

  // This is only valid in single threaded applications
  container.register('contextHolder', function () {
    var context = {
      getToken: function () {
        return '';
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

  // Get available commands from fs.
  // The idea behind this is to avoid harcoding the available commands in the code.
  var commands = fs.readdirSync(path.join(path.resolve(__dirname), COMMANDS_LOCATION));

  container.register('commands', function () {
    return _.map(commands, function (command) {
      // Remove Command.js from command file names.
      return command.split('Command.')[0];
    });
  });

  return container;
}

module.exports = {
  createContainer: createContainer
};
