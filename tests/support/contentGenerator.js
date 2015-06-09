'use strict';

var _ = require('lodash');

module.exports = {
  generateSubOrgs: generateSubOrgs,
  generateApis: generateApis,
  generateWorkspace: generateWorkspace
};

function generateSubOrgs(number) {
  number = number ? number : 10;
  return _.range(1, number + 1)
    .map(function (n) {
      return {
        id: n,
        name: 'subOrg' + n
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
    subOrg: {
      id: 1234
    }
  };
}
