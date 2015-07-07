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

var fileList = [
  'api1.raml',
  'api2.raml',
  'api3.raml',
  'api4.raml',
  'schema.json',
  'another.json',
  'schema-other.json'
];

var fileHash = '123456asdfg';

// Returns files api1.raml, api2.raml, api3.raml, api4.raml, api5.raml,
// api6.raml
var currentWorkspace = contentGenerator.generateWorkspaceWithFiles(6);
// Add old file metadata to workspace (without audit information).
currentWorkspace.files.push({
  id: 10,
  path: 'schema-other.json'
});

// Returns files api1.raml, api2.raml, api3.raml
var apiFiles = contentGenerator.getAPIFilesMetadata(3);

// Modify api2.raml in the API files list.
apiFiles[1].audit.updated.date = '2015-10-05 00:05:00';

// Add new file to the API files list.
apiFiles.push({
  audit: {
    created: {
      date: '2015-10-05 00:05:00'
    },
    updated: {}
  },
  id: 10,
  path: 'schema.json'
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
  path: 'schema-other.json'
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
  path: 'api5.raml'
});

describe('localService', function () {
  beforeEach(function () {
    apiPlatformRepositoryStub.getAPIFilesMetadata = sinon.stub().returns(
      BPromise.resolve(apiFiles));

    fileSystemRepositoryStub.getFilesPath = sinon.stub().returns(
      BPromise.resolve(fileList));
    fileSystemRepositoryStub.getFileHash = sinon.stub();

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
      fileSystemRepositoryStub.getFileHash.onFirstCall().returns(
        BPromise.resolve(currentWorkspace.files[0].hash));
      localService.status()
        .then(function (result) {
          result.unchanged.should.be.an.Array();
          result.unchanged.length.should.equal(1);
          result.changed.should.be.an.Array();
          result.changed.length.should.equal(4);
          result.deleted.should.be.an.Array();
          result.deleted.length.should.equal(2);
          result.added.should.be.an.Array();
          result.added.length.should.equal(2);

          result.unchanged.should.containEql(fileList[0]);
          result.changed.should.containEql(fileList[1]);
          result.changed.should.containEql(fileList[2]);
          result.changed.should.containEql(fileList[3]);
          result.changed.should.containEql(fileList[6]);
          result.deleted.should.containEql(currentWorkspace.files[4].path);
          result.deleted.should.containEql(currentWorkspace.files[5].path);
          result.added.should.containEql(fileList[4]);
          result.added.should.containEql(fileList[5]);
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
      fileSystemRepositoryStub.getFileHash.onFirstCall().returns(
        BPromise.resolve(currentWorkspace.files[0].hash));

      localService.conflicts()
        .then(function (conflicts) {
          conflicts.addedAlreadyExists.should.be.an.Array();
          conflicts.addedAlreadyExists.length.should.equal(1);
          conflicts.addedAlreadyExists.should.containEql(fileList[4]);

          conflicts.changedWasDeleted.should.be.an.Array();
          conflicts.changedWasDeleted.length.should.equal(1);
          conflicts.changedWasDeleted.should.containEql(fileList[3]);

          conflicts.changedRemotely.should.be.an.Array();
          conflicts.changedRemotely.length.should.equal(2);
          conflicts.changedRemotely.should.containEql(fileList[1]);
          // Changed files without audit information will be interpreted as
          // changed remotely if remote file has an update date.
          conflicts.changedRemotely.should.containEql(fileList[6]);

          conflicts.deletedNotExists.should.be.an.Array();
          conflicts.deletedNotExists.length.should.equal(1);
          conflicts.deletedNotExists.should.containEql(
            currentWorkspace.files[5].path);

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
