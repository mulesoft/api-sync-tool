'use strict';

require('should');
var sinon = require('sinon');

var containerFactory  = require('../support/testContainerFactory');
var contentGenerator  = require('../support/contentGenerator');

var fileSystemRepositoryStub = {};
var workspaceRepositoryStub = {};

var fileList = [
  'api1.raml',
  'api2.raml',
  'api3.raml',
  'schema.json'
];

var fileHash = '123456asdfg';

var currentWorkspace = contentGenerator.generateWorkspaceWithFiles(4);

describe('localService', function () {
  beforeEach(function () {
    fileSystemRepositoryStub.getFilesPath = sinon.stub().returns(
      Promise.resolve(fileList));
    fileSystemRepositoryStub.getFileHash = sinon.stub();

    workspaceRepositoryStub.get = sinon.stub().returns(
      Promise.resolve(currentWorkspace));
  });

  describe('status', run(function (localService) {
    it('should return the current local status', function (done) {
      fileSystemRepositoryStub.getFileHash.returns(Promise.resolve(fileHash));
      fileSystemRepositoryStub.getFileHash.onFirstCall().returns(
        Promise.resolve(currentWorkspace.files[0].hash));
      localService.status()
        .then(function (result) {
          result.unchanged.should.be.an.Array;
          result.unchanged.length.should.equal(1);
          result.changed.should.be.an.Array;
          result.changed.length.should.equal(2);
          result.deleted.should.be.an.Array;
          result.deleted.length.should.equal(1);
          result.added.should.be.an.Array;
          result.added.length.should.equal(1);

          result.unchanged.should.containEql(fileList[0]);
          result.changed.should.containEql(fileList[1]);
          result.changed.should.containEql(fileList[2]);
          result.deleted.should.containEql(currentWorkspace.files[3].path);
          result.added.should.containEql(fileList[3]);
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
    container.register('fileSystemRepository', fileSystemRepositoryStub);
    container.register('workspaceRepository', workspaceRepositoryStub);
    container.resolve(callback);
  };
}
