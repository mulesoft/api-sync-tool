'use strict';

var should = require('should');
var sinon = require('sinon');

var asserts = require('../support/asserts');
var containerFactory  = require('../support/testContainerFactory');
var contentGenerator = require('../support/contentGenerator');

var apiPlatformServiceStub = {};
var loggerStub = {};
var messagesStub = {};
var workspaceRepositoryStub = {};

describe('pullController', function () {
  var downloadMessage = 'download';
  var finishMessage = 'finish';

  var currentWorkspace = contentGenerator.generateWorkspaceWithFiles();
  var filesMetadata = contentGenerator.getWorkspaceFilesMetadata();

  beforeEach(function () {
    workspaceRepositoryStub.get = sinon.stub().returns(
      Promise.resolve(currentWorkspace));

    apiPlatformServiceStub.getAPIFiles = sinon.stub().returns(
      Promise.resolve(filesMetadata));

    workspaceRepositoryStub.update = sinon.stub().returns(Promise.resolve());
    loggerStub.info = sinon.stub();

    messagesStub.downloadingAPI = sinon.stub().returns(downloadMessage);
    messagesStub.finishedDownloadingAPI = sinon.stub().returns(finishMessage);
  });

  describe('getAPIFiles', run(function (pullController) {
    it('should run correctly', function (done) {
      pullController.getAPIFiles()
        .then(function (workspaceFiles) {
          asserts.calledOnceWithoutParameters([workspaceRepositoryStub.get,
            messagesStub.downloadingAPI, messagesStub.finishedDownloadingAPI]);

          asserts.calledOnceWithExactly(apiPlatformServiceStub.getAPIFiles, [
            currentWorkspace.bizGroup.id,
            currentWorkspace.api.id,
            currentWorkspace.apiVersion.id
          ]);

          asserts.calledOnceWithExactly(workspaceRepositoryStub.update, [
            currentWorkspace
          ]);

          loggerStub.info.calledTwice.should.be.true();
          loggerStub.info.firstCall.calledWithExactly(downloadMessage)
            .should.be.true();
          loggerStub.info.secondCall.calledWithExactly(finishMessage)
            .should.be.true();

          workspaceFiles.should.be.an.Array();
          workspaceFiles.length.should.equal(10);
          should.deepEqual(workspaceFiles[0], currentWorkspace.files[0]);

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
    container.register('apiPlatformService', apiPlatformServiceStub);
    container.register('workspaceRepository', workspaceRepositoryStub);
    container.register('logger', loggerStub);
    container.register('messages', messagesStub);

    container.resolve(callback);
  };
}
