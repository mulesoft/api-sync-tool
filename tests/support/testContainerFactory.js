
'use strict';

var containerFactory = require('../../lib/containerFactory');

function createContainer() {
  var container = containerFactory.createContainer();

  return container;
}

module.exports = createContainer();
module.exports.createContainer = createContainer;
