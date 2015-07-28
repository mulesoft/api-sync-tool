'use strict';

var _ = require('lodash');

module.exports = {
  generateBusinessGroups: generateBusinessGroups,
  generateApis: generateApis,
  generateWorkspace: generateWorkspace,
  generateWorkspaceWithFiles: generateWorkspaceWithFiles,
  getWorkspaceFilesMetadata: getWorkspaceFilesMetadata,
  getAPIFilesMetadata: getAPIFilesMetadata
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
      id: 1234,
      rootFileId: -1
    },
    bizGroup: {
      id: 1234
    }
  };
}

function generateWorkspaceWithFiles(number) {
  var workspace = generateWorkspace();
  workspace.files = getWorkspaceFilesMetadata(number);
  workspace.directories = [];
  return workspace;
}

function getWorkspaceFilesMetadata(number, hash) {
  number = number ? number : 10;
  return _.range(1, number + 1)
    .map(function (n) {
      return {
        audit: {
          created: {
            date: '2015-10-05 00:05:00'
          },
          updated: {}
        },
        path: 'api' + n + '.raml',
        hash: hash + 'asdf' + n
      };
    });
}

function getAPIFilesMetadata(number) {
  number = number ? number : 10;
  return _.range(1, number + 1)
    .map(function (n) {
      return {
        audit: {
          created: {
            date: '2015-10-05 00:05:00'
          },
          updated: {}
        },
        id: n,
        path: 'api' + n + '.raml'
      };
    });
}
