
'use strict';

var containerFactory = require('../../containerFactory');

function createContainer() {
  var container = containerFactory.createContainer();

  return container;
}

module.exports = createContainer();
module.exports.createContainer = createContainer;
