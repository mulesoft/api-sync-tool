'use strict';

var containerFactory = require('./containerFactory');
var container = containerFactory.createContainer();

module.exports = function (args) {
  container.get('application')
    .run(args);
};
