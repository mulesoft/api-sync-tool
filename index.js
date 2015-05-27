#! /usr/bin/env node

'use strict';

var fs = require('fs');
var path = require('path');
var _ = require('lodash');
var omelette = require('omelette');

// Get command line arguments.
var args = _.clone(process.argv);
// Remove node and script file name.
args.splice(0, 2);

var commandName = args[0];

// Get available commands.
var commands = fs.readdirSync(path.join(path.resolve(__dirname), 'commands'));
// Remove .js from command file names.
commands = _.map(commands, function (command) {
  return command.split('.')[0];
});

// Setup autocomplete
var complete = omelette("api-sync <command>");

complete.on("command", function() {
  this.reply(commands);
});

// Initialize the omelette.
complete.init();

if (args < 1) {
  console.log('Error: Missing command name.');
  console.log('Usage: api-sync <' + commands.join('|') + '>');
  process.exit(0);
}

if (!_.includes(commands, commandName)) {
  console.log('Unknown command: ' + commandName);
  console.log('Usage: api-sync <' + commands.join('|') + '>');
  process.exit(0);
}

var command = require('./commands/' + commandName);
command.execute(args)
  .then(console.log)
  .catch(console.log);
