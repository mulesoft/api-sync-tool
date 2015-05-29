'use strict';

var fs = require('fs');
var path = require('path');
var _ = require('lodash');
var omelette = require('omelette');

var messages = require('./messages');

module.exports = function (args) {
  var commandName = args._[0];

  // Get available commands.
  var commands = fs.readdirSync(path.join(path.resolve(__dirname), 'commands'));
  // Remove .js from command file names.
  commands = _.map(commands, function (command) {
    return command.split('.')[0];
  });

  // Setup autocomplete
  var complete = omelette('api-sync <command>');

  complete.on('command', function() {
    this.reply(commands);
  });

  // Initialize the omelette.
  complete.init();

  if (args < 1) {
    console.log(messages.noCommand(commands));
    process.exit(1);
  }

  if (!_.includes(commands, commandName)) {
    console.log(messages.unknown(commandName, commands));
    process.exit(1);
  }

  var view = require('./views/' + commandName + 'View');

  var command = require('./commands/' + commandName);
  view.parseInput(args)
    .then(command.execute)
    .then(view.displayOutput)
    .then(function () {
      process.exit(0);
    })
    .catch(function (output) {
      console.error(output);
      process.exit(1);
    });
};
