'use strict';

var BPromise = require('bluebird');

var should = require('should');
var sinon = require('sinon');

var asserts = require('../support/asserts');
var containerFactory  = require('../support/testContainerFactory');
var contentGenerator  = require('../support/contentGenerator');

var apiPlatformRepositoryStub = {};
var fileSystemRepositoryStub = {};
var workspaceRepositoryStub = {};

var unchangedFileName = 'api1.raml';
var unchangedLocalDeletedRemoteFileName = 'api2.raml';
var changedLocalChangedRemoteFileName = 'api3.raml';
var changedLocalDeletedRemoteFileName1 = 'api4.raml';
var changedLocalDeletedRemoteFileName2 = 'api5.raml';
var deletedLocalExistsRemote = 'api6.raml';
var deletedLocalDeletedRemote = 'api7.raml';
var addedLocalFileName = 'schema.json';
var changedLocalFileNameWithoutAudit = 'another.json';
var changedLocalFileName = 'changedLocal';
var changedLocalFileCreatedAgainRemotely = 'api8.raml';
var addedLocalExistsRemoteFileName = 'schema-other.json';

var existingDirectoryPath = '/schemas';
var addedDirectoryPath = '/examples';
var deletedDirectoryPath = '/temp';

var fileList = [
  unchangedFileName,
  unchangedLocalDeletedRemoteFileName,
  changedLocalChangedRemoteFileName,
  changedLocalDeletedRemoteFileName1,
  changedLocalDeletedRemoteFileName2,
  addedLocalFileName,
  changedLocalFileNameWithoutAudit,
  changedLocalFileName,
  changedLocalFileCreatedAgainRemotely,
  addedLocalExistsRemoteFileName
];

var directoriesList = [
  existingDirectoryPath,
  addedDirectoryPath
];

var fileHash = '123456asdfg';

var currentWorkspace = contentGenerator.generateWorkspaceWithFiles(7);
// Add old file metadata to workspace (without audit information).
currentWorkspace.files.push({
  id: 10,
  path: changedLocalFileNameWithoutAudit
});
currentWorkspace.files.push({
  id: 11,
  path: changedLocalFileCreatedAgainRemotely,
  audit: {
    created: {
      date: '2015-10-05 00:02:00'
    },
    updated: {
      date: '2015-10-05 00:03:00'
    }
  }
});
currentWorkspace.files.push({
  id: 11,
  path: changedLocalFileName,
  audit: {
    created: {
      date: '2015-10-05 00:02:00'
    },
    updated: {
      date: '2015-10-05 00:05:00'
    }
  }
});

// Add existing directory to workspace.
currentWorkspace.directories.push({
  path: existingDirectoryPath
});

// Add existing directory to workspace.
currentWorkspace.directories.push({
  path: deletedDirectoryPath
});

// Returns files api1.raml [0] No conflicts
var apiFiles = contentGenerator.getAPIFilesMetadata(1);

// Add new file to the API files list.
// apiFiles[1] Changed locally and remotely
apiFiles.push({
  audit: {
    created: {
      date: '2015-10-05 00:05:00'
    },
    updated: {
      date: '2015-10-05 00:06:00'
    }
  },
  id: 12,
  path: changedLocalChangedRemoteFileName
});

// Add new file to the API files list.
// apiFiles[2] Changed locally and remotely
apiFiles.push({
  audit: {
    created: {
      date: '2015-10-05 00:05:00'
    },
    updated: {}
  },
  id: 10,
  path: changedLocalFileNameWithoutAudit
});

// Add changed file to the API files list.
apiFiles.push({
  audit: {
    created: {
      date: '2015-10-05 00:05:00'
    },
    updated: {
      date: '2015-12-01 00:05:00'
    }
  },
  id: 11,
  path: addedLocalExistsRemoteFileName
});

// Add new file to the API files list.
apiFiles.push({
  audit: {
    created: {
      date: '2015-10-05 00:05:00'
    },
    updated: {}
  },
  id: 12,
  path: deletedLocalExistsRemote
});

apiFiles.push({
  audit: {
    created: {
      date: '2015-10-05 00:05:00'
    },
    updated: {}
  },
  id: 13,
  path: changedLocalFileCreatedAgainRemotely
});

apiFiles.push({
  audit: {
    created: {
      date: '2015-10-05 00:02:00'
    },
    updated: {
      date: '2015-10-05 00:05:00'
    }
  },
  id: 10,
  path: changedLocalFileName
});

describe('localService', function () {
  beforeEach(function () {
    apiPlatformRepositoryStub.getAPIFilesMetadata = sinon.stub().returns(
      BPromise.resolve(apiFiles));

    fileSystemRepositoryStub.getFilesPath = sinon.stub().returns(
      BPromise.resolve(fileList));

    fileSystemRepositoryStub.getFileHash = sinon.stub();
    fileSystemRepositoryStub.getFileHash.onFirstCall().returns(
      BPromise.resolve(currentWorkspace.files[0].hash));
    fileSystemRepositoryStub.getFileHash.onSecondCall().returns(
      BPromise.resolve(currentWorkspace.files[1].hash));

      fileSystemRepositoryStub.getDirectoriesPath = sinon.stub()
        .returns(BPromise.resolve(directoriesList));

    workspaceRepositoryStub.get = sinon.stub().returns(
      BPromise.resolve(currentWorkspace));
  });

  describe('getFilesPath', run(function (localService) {
    it('should return the local folder files paths', function (done) {
      var filesPaths = ['/file1.raml', '/folder1/file2.raml'];
      fileSystemRepositoryStub.getFilesPath =
        sinon.stub().returns(BPromise.resolve(filesPaths));

      localService.getFilesPath()
        .then(function (result) {
          should.deepEqual(result, filesPaths);

          asserts.calledOnceWithoutParameters([
            fileSystemRepositoryStub.getFilesPath]);

          done();
        })
        .catch(function (err) {
          done(err);
        });
    });
  }));

  describe('status', run(function (localService) {
    it('should return the current local status', function (done) {
      fileSystemRepositoryStub.getFileHash.returns(BPromise.resolve(fileHash));

      localService.getStatus()
        .then(function (result) {
          should.deepEqual(result, {
            addedDirectories: [addedDirectoryPath],
            deletedDirectories: [deletedDirectoryPath],
            unchanged: [unchangedFileName, unchangedLocalDeletedRemoteFileName],
            changed: [
              changedLocalChangedRemoteFileName,
              changedLocalDeletedRemoteFileName1,
              changedLocalDeletedRemoteFileName2,
              changedLocalFileNameWithoutAudit,
              changedLocalFileName,
              changedLocalFileCreatedAgainRemotely
            ],
            deleted: [deletedLocalExistsRemote, deletedLocalDeletedRemote],
            added: [addedLocalFileName, addedLocalExistsRemoteFileName]
          });

          done();
        })
        .catch(function (err) {
          done(err);
        });
    });
  }));

  describe('conflicts', run(function (localService) {
    describe('with rootRaml', function () {
      it('should return conflicts', function (done) {
        fileSystemRepositoryStub.getFileHash.returns(BPromise.resolve(fileHash));

        localService.getConflicts()
          .then(function (conflicts) {
            should.deepEqual(conflicts, {
              addedAlreadyExists: [addedLocalExistsRemoteFileName],
              changedWasDeleted: [
                changedLocalDeletedRemoteFileName1,
                changedLocalDeletedRemoteFileName2
              ],
              changedRemotely: [
                changedLocalChangedRemoteFileName,
                changedLocalFileNameWithoutAudit,
                changedLocalFileCreatedAgainRemotely
              ],
              deletedRemotely: [unchangedLocalDeletedRemoteFileName],
              deletedNotExists: [deletedLocalDeletedRemote]
            });

            done();
          })
          .catch(function (err) {
            done(err);
          });
      });
    });

    describe('with rootRaml deleted', function () {
      var rootRamlPath = deletedLocalExistsRemote;
      beforeEach(function () {
        currentWorkspace.rootRamlPath = rootRamlPath;
      });

      it('should return conflicts', function (done) {
        fileSystemRepositoryStub.getFileHash.returns(BPromise.resolve(fileHash));

        localService.getConflicts()
          .then(function (conflicts) {
            should.deepEqual(conflicts, {
              addedAlreadyExists: [addedLocalExistsRemoteFileName],
              changedWasDeleted: [
                changedLocalDeletedRemoteFileName1,
                changedLocalDeletedRemoteFileName2
              ],
              changedRemotely: [
                changedLocalChangedRemoteFileName,
                changedLocalFileNameWithoutAudit,
                changedLocalFileCreatedAgainRemotely
              ],
              deletedRemotely: [unchangedLocalDeletedRemoteFileName],
              deletedNotExists: [deletedLocalDeletedRemote],
              rootRamlDeleted: rootRamlPath
            });

            done();
          })
          .catch(function (err) {
            done(err);
          });
      });
    });
  }));
});

function run(callback) {
  return function () {
    var container = containerFactory.createContainer();
    container.register('apiPlatformRepository', apiPlatformRepositoryStub);
    container.register('fileSystemRepository', fileSystemRepositoryStub);
    container.register('workspaceRepository', workspaceRepositoryStub);
    container.resolve(callback);
  };
}
