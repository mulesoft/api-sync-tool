'use strict';

var _ = require('lodash');

module.exports = {
  generateBusinessGroups: generateBusinessGroups,
  generateApis: generateApis,
  generateWorkspace: generateWorkspace
};

function generateBusinessGroups(number) {
  number = number ? number : 10;
  return _.range(1, number + 1)
    .map(function (n) {
      return {
        id: n,
        name: 'bizGroup' + n
      };
    });
}

function generateApis(number) {
  number = number ? number : 10;
  return _.range(1, number + 1)
    .map(function (n) {
      return {
        id: n,
        name: 'api' + n,
        versions: [{
          id: 1,
          name: 'version1'
        }]
      };
    });
}

function generateWorkspace() {
  return {
    api: {
      id: 1234
    },
    apiVersion: {
      id: 1234
    },
    bizGroup: {
      id: 1234
    }
  };
}
