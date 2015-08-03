'use strict';

var BPromise = require('bluebird');

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
  var remoteFilesMetadata = contentGenerator.getAPIFilesMetadata();
  var rootRaml = remoteFilesMetadata[0];
  rootRaml.id = -1;
  var apiFilesResponse = {
    files: filesMetadata,
    directories: []
  };

  describe('getAPIFiles', run(function (pullController) {
    beforeEach(function () {
      workspaceRepositoryStub.get = sinon.stub().returns(
        BPromise.resolve(currentWorkspace));

      apiPlatformServiceStub.getAPIFiles = sinon.stub().returns(
        BPromise.resolve(apiFilesResponse));

      apiPlatformServiceStub.getAPIFilesMetadata = sinon.stub();

      workspaceRepositoryStub.update = sinon.stub().returns(BPromise.resolve());
      loggerStub.info = sinon.stub();

      messagesStub.downloadingAPI = sinon.stub().returns(downloadMessage);
      messagesStub.finishedDownloadingAPI = sinon.stub().returns(finishMessage);
    });

    it('should run correctly', function (done) {
      apiPlatformServiceStub.getAPIFilesMetadata.returns(
        BPromise.resolve(remoteFilesMetadata));

      pullController.getAPIFiles()
        .then(function (result) {
          asserts.calledOnceWithoutParameters([workspaceRepositoryStub.get,
            messagesStub.downloadingAPI, messagesStub.finishedDownloadingAPI]);

          asserts.calledOnceWithExactly(apiPlatformServiceStub.getAPIFiles, [
            currentWorkspace.bizGroup.id,
            currentWorkspace.api.id,
            currentWorkspace.apiVersion.id
          ]);

          asserts.calledOnceWithExactly(apiPlatformServiceStub.getAPIFilesMetadata,
              [
            currentWorkspace.bizGroup.id,
            currentWorkspace.api.id,
            currentWorkspace.apiVersion.id
          ]);

          asserts.calledOnceWithExactly(workspaceRepositoryStub.update, [
            currentWorkspace
          ]);

          currentWorkspace.rootRamlPath.should.equal(rootRaml.path);

          loggerStub.info.calledTwice.should.be.true();
          loggerStub.info.firstCall.calledWithExactly(downloadMessage)
            .should.be.true();
          loggerStub.info.secondCall.calledWithExactly(finishMessage)
            .should.be.true();

          should.deepEqual(result, apiFilesResponse);

          done();
        })
        .catch(function (err) {
          done(err);
        });
    });

    it('should run correctly when API has no files', function (done) {
      apiPlatformServiceStub.getAPIFilesMetadata.returns(
        BPromise.resolve([]));

      pullController.getAPIFiles()
        .then(function () {
          asserts.calledOnceWithoutParameters([workspaceRepositoryStub.get,
            messagesStub.downloadingAPI, messagesStub.finishedDownloadingAPI]);

          asserts.calledOnceWithExactly(apiPlatformServiceStub.getAPIFiles, [
            currentWorkspace.bizGroup.id,
            currentWorkspace.api.id,
            currentWorkspace.apiVersion.id
          ]);

          asserts.calledOnceWithExactly(apiPlatformServiceStub.getAPIFilesMetadata,
              [
            currentWorkspace.bizGroup.id,
            currentWorkspace.api.id,
            currentWorkspace.apiVersion.id
          ]);

          asserts.calledOnceWithExactly(workspaceRepositoryStub.update, [
            currentWorkspace
          ]);

          currentWorkspace.rootRamlPath.should.equal(rootRaml.path);

          loggerStub.info.calledTwice.should.be.true();
          loggerStub.info.firstCall.calledWithExactly(downloadMessage)
            .should.be.true();
          loggerStub.info.secondCall.calledWithExactly(finishMessage)
            .should.be.true();

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
