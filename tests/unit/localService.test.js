'use strict';

var BPromise = require('bluebird');

var should = require('should');
var sinon = require('sinon');

var containerFactory  = require('../support/testContainerFactory');
var contentGenerator  = require('../support/contentGenerator');
var asserts = require('../support/asserts');

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
var changedLocalFileName = 'another.json';
var addedLocalExistsRemoteFileName = 'schema-other.json';

var fileList = [
  unchangedFileName,
  unchangedLocalDeletedRemoteFileName,
  changedLocalChangedRemoteFileName,
  changedLocalDeletedRemoteFileName1,
  changedLocalDeletedRemoteFileName2,
  addedLocalFileName,
  changedLocalFileName,
  addedLocalExistsRemoteFileName
];

var fileHash = '123456asdfg';

var currentWorkspace = contentGenerator.generateWorkspaceWithFiles(7);
// Add old file metadata to workspace (without audit information).
currentWorkspace.files.push({
  id: 10,
  path: changedLocalFileName
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
      date: '2015-10-05 00:05:00'
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
  path: changedLocalFileName
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

    workspaceRepositoryStub.get = sinon.stub().returns(
      BPromise.resolve(currentWorkspace));
  });

  describe('getDirectoriesPath', run(function (localService) {
    it('should pass the call to fileSystemRepository', function (done) {
      var dirs = [{path: 'x'}];
      fileSystemRepositoryStub.getDirectoriesPath = sinon.stub()
        .returns(BPromise.resolve(dirs));
      localService.getDirectoriesPath()
        .then(function (output) {
          asserts.calledOnceWithoutParameters([
            fileSystemRepositoryStub.getDirectoriesPath
          ]);
          should.deepEqual(output, dirs);

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
          result.unchanged.should.be.an.Array();
          result.unchanged.length.should.equal(2);
          result.changed.should.be.an.Array();
          result.changed.length.should.equal(4);
          result.deleted.should.be.an.Array();
          result.deleted.length.should.equal(2);
          result.added.should.be.an.Array();
          result.added.length.should.equal(2);

          result.unchanged.should.containEql(unchangedFileName);
          result.unchanged.should.containEql(
            unchangedLocalDeletedRemoteFileName);
          result.changed.should.containEql(changedLocalChangedRemoteFileName);
          result.changed.should.containEql(changedLocalDeletedRemoteFileName1);
          result.changed.should.containEql(changedLocalDeletedRemoteFileName2);
          result.changed.should.containEql(changedLocalFileName);
          result.deleted.should.containEql(deletedLocalExistsRemote);
          result.deleted.should.containEql(deletedLocalDeletedRemote);
          result.added.should.containEql(addedLocalFileName);
          result.added.should.containEql(addedLocalExistsRemoteFileName);
          done();
        })
        .catch(function (err) {
          done(err);
        });
    });
  }));

  describe('conflicts', run(function (localService) {
    it('should return conflicts', function (done) {
      fileSystemRepositoryStub.getFileHash.returns(BPromise.resolve(fileHash));

      localService.getConflicts()
        .then(function (conflicts) {
          conflicts.addedAlreadyExists.should.be.an.Array();
          conflicts.addedAlreadyExists.length.should.equal(1);
          conflicts.changedWasDeleted.should.be.an.Array();
          conflicts.changedWasDeleted.length.should.equal(2);
          conflicts.changedRemotely.should.be.an.Array();
          conflicts.changedRemotely.length.should.equal(1);
          conflicts.deletedRemotely.should.be.an.Array();
          conflicts.deletedRemotely.length.should.equal(1);
          conflicts.deletedNotExists.should.be.an.Array();
          conflicts.deletedNotExists.length.should.equal(1);

          conflicts.addedAlreadyExists.should.containEql(
            addedLocalExistsRemoteFileName);
          conflicts.changedWasDeleted.should.containEql(
            changedLocalDeletedRemoteFileName1);
          conflicts.changedWasDeleted.should.containEql(
            changedLocalDeletedRemoteFileName2);
          conflicts.changedRemotely.should.containEql(
            changedLocalChangedRemoteFileName);
          conflicts.deletedRemotely.should.containEql(
            unchangedLocalDeletedRemoteFileName);
          conflicts.deletedNotExists.should.containEql(
            deletedLocalDeletedRemote);

          done();
        })
        .catch(function (err) {
          done(err);
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
