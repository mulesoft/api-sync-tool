'use strict';

var BPromise = require('bluebird');

var should = require('should');
var sinon = require('sinon');
var _ = require('lodash');

var asserts = require('../support/asserts');
var containerFactory  = require('../support/testContainerFactory');
var contentGenerator = require('../support/contentGenerator');

var apiPlatformServiceStub = {};
var localServiceStub = {};
var loggerStub = {};
var messagesStub = {};
var workspaceRepositoryStub = {};

describe('pushController', function () {
  var newMessage = 'new';
  var changedMessage = 'changed';
  var deletedMessage = 'deleted';

  var currentWorkspace = contentGenerator.generateWorkspaceWithFiles();
  var apiFilesMetadata = contentGenerator.getAPIFilesMetadata();

  beforeEach(function () {
    workspaceRepositoryStub.get = sinon.stub().returns(
      BPromise.resolve(currentWorkspace));
    localServiceStub.status = sinon.stub();

    apiPlatformServiceStub.getAPIFilesMetadata = sinon.stub().returns(
      BPromise.resolve(apiFilesMetadata));

    apiPlatformServiceStub.createAPIFile = sinon.stub();
    apiPlatformServiceStub.updateAPIFile = sinon.stub();
    apiPlatformServiceStub.deleteAPIFile = sinon.stub();

    workspaceRepositoryStub.update = sinon.stub().returns(BPromise.resolve());
    loggerStub.info = sinon.stub();

    messagesStub.pushProgressNew = sinon.stub().returns(newMessage);
    messagesStub.pushProgressChanged = sinon.stub().returns(changedMessage);
    messagesStub.pushProgressDeleted = sinon.stub().returns(deletedMessage);
    messagesStub.newDirectoriesEmpty = sinon.stub();
    messagesStub.creatingDirectory = sinon.stub();
    messagesStub.uploadingFile = sinon.stub();
    messagesStub.deletingFile = sinon.stub();
  });

  describe('push', run(function (pushController) {
    it('should run correctly', function (done) {
      var status = {
        added: [
          currentWorkspace.files[0].path,
          currentWorkspace.files[1].path,
          currentWorkspace.files[2].path,
          currentWorkspace.files[3].path
        ],
        changed: [
          currentWorkspace.files[4].path,
          currentWorkspace.files[5].path,
          currentWorkspace.files[6].path
        ],
        deleted: [
          currentWorkspace.files[7].path,
          currentWorkspace.files[8].path,
          currentWorkspace.files[9].path
        ]
      };

      apiPlatformServiceStub.createAPIFile
        .onFirstCall().returns(BPromise.resolve(currentWorkspace.files[0]))
        .onSecondCall().returns(BPromise.resolve(currentWorkspace.files[1]))
        .onThirdCall().returns(BPromise.resolve(currentWorkspace.files[2]))
        .onCall(3).returns(BPromise.resolve(currentWorkspace.files[3]));

      apiPlatformServiceStub.updateAPIFile
        .onFirstCall().returns(BPromise.resolve(currentWorkspace.files[4]))
        .onSecondCall().returns(BPromise.resolve(currentWorkspace.files[5]))
        .onThirdCall().returns(BPromise.resolve(currentWorkspace.files[6]));

      apiPlatformServiceStub.deleteAPIFile
        .onFirstCall().returns(BPromise.resolve(currentWorkspace.files[7].path))
        .onSecondCall().returns(BPromise.resolve(currentWorkspace.files[8].path))
        .onThirdCall().returns(BPromise.resolve(currentWorkspace.files[9].path));

      localServiceStub.status.returns(BPromise.resolve(status));
      localServiceStub.getDirectoriesPath = sinon.stub()
        .returns(BPromise.resolve([
          '/folder2',
          '/folder1',
          '/folder2/folder21'
        ]));

      var firstDirectoryResult = {
        path: '/folder1',
        id: 100
      };
      var secondDirectoryResult = {
        path: '/folder2',
        id: 101
      };
      var thirdDirectoryResult = {
        path: '/folder2/folder21',
        id: 102
      };

      var firstDirectory = {
        path: '/folder1',
        parentId: null
      };
      var secondDirectory = {
        path: '/folder2',
        parentId: null
      };
      var thirdDirectory = {
        path: '/folder2/folder21',
        parentId: 101
      };

      apiPlatformServiceStub.createAPIDirectory = sinon.stub();
      apiPlatformServiceStub.createAPIDirectory
        .onFirstCall().returns(BPromise.resolve(firstDirectoryResult));
      apiPlatformServiceStub.createAPIDirectory
        .onSecondCall().returns(BPromise.resolve(secondDirectoryResult));
      apiPlatformServiceStub.createAPIDirectory
        .onThirdCall().returns(BPromise.resolve(thirdDirectoryResult));

      pushController.push()
        .then(function (output) {
          workspaceRepositoryStub.get.calledOnce.should.be.true();
          workspaceRepositoryStub.get.firstCall.args.length.should.equal(0);

          localServiceStub.status.calledOnce.should.be.true();
          localServiceStub.status.firstCall.args.length.should.equal(0);

          apiPlatformServiceStub.getAPIFilesMetadata.calledOnce.should.be.true();
          apiPlatformServiceStub.getAPIFilesMetadata.calledWithExactly(
            currentWorkspace.bizGroup.id,
            currentWorkspace.api.id,
            currentWorkspace.apiVersion.id
          ).should.be.true();

          asserts.calledOnceWithoutParameters([
            localServiceStub.getDirectoriesPath]);

          apiPlatformServiceStub.createAPIDirectory.calledThrice;
          apiPlatformServiceStub.createAPIDirectory
            .firstCall.calledWithExactly(firstDirectory);
          apiPlatformServiceStub.createAPIDirectory
            .secondCall.calledWithExactly(secondDirectory);
          apiPlatformServiceStub.createAPIDirectory
            .thirdCall.calledWithExactly(thirdDirectory);

          apiPlatformServiceStub.createAPIFile.callCount.should.equal(4);
          apiPlatformServiceStub.createAPIFile.firstCall.calledWithExactly(
            currentWorkspace.bizGroup.id,
            currentWorkspace.api.id,
            currentWorkspace.apiVersion.id,
            sinon.match({
              path: currentWorkspace.files[0].path,
              parentId: null
            })
          ).should.be.true();

          apiPlatformServiceStub.createAPIFile.secondCall.calledWithExactly(
            currentWorkspace.bizGroup.id,
            currentWorkspace.api.id,
            currentWorkspace.apiVersion.id,
            sinon.match({
              path: currentWorkspace.files[1].path,
              parentId: null
            })
          ).should.be.true();

          apiPlatformServiceStub.createAPIFile.thirdCall.calledWithExactly(
            currentWorkspace.bizGroup.id,
            currentWorkspace.api.id,
            currentWorkspace.apiVersion.id,
            sinon.match({
              path: currentWorkspace.files[2].path,
              parentId: null
            })
          ).should.be.true();

          apiPlatformServiceStub.createAPIFile.lastCall.calledWithExactly(
            currentWorkspace.bizGroup.id,
            currentWorkspace.api.id,
            currentWorkspace.apiVersion.id,
            sinon.match({
              path: currentWorkspace.files[3].path,
              parentId: null
            })
          ).should.be.true();

          apiPlatformServiceStub.updateAPIFile.calledThrice.should.be.true();
          apiPlatformServiceStub.updateAPIFile.firstCall.calledWithExactly(
            currentWorkspace.bizGroup.id,
            currentWorkspace.api.id,
            currentWorkspace.apiVersion.id,
            apiFilesMetadata[4]
          ).should.be.true();

          apiPlatformServiceStub.updateAPIFile.secondCall.calledWithExactly(
            currentWorkspace.bizGroup.id,
            currentWorkspace.api.id,
            currentWorkspace.apiVersion.id,
            apiFilesMetadata[5]
          ).should.be.true();

          apiPlatformServiceStub.updateAPIFile.thirdCall.calledWithExactly(
            currentWorkspace.bizGroup.id,
            currentWorkspace.api.id,
            currentWorkspace.apiVersion.id,
            apiFilesMetadata[6]
          ).should.be.true();

          apiPlatformServiceStub.deleteAPIFile.calledThrice.should.be.true();
          apiPlatformServiceStub.deleteAPIFile.firstCall.calledWithExactly(
            currentWorkspace.bizGroup.id,
            currentWorkspace.api.id,
            currentWorkspace.apiVersion.id,
            apiFilesMetadata[7]
          ).should.be.true();

          apiPlatformServiceStub.deleteAPIFile.secondCall.calledWithExactly(
            currentWorkspace.bizGroup.id,
            currentWorkspace.api.id,
            currentWorkspace.apiVersion.id,
            apiFilesMetadata[8]
          ).should.be.true();

          apiPlatformServiceStub.deleteAPIFile.thirdCall.calledWithExactly(
            currentWorkspace.bizGroup.id,
            currentWorkspace.api.id,
            currentWorkspace.apiVersion.id,
            apiFilesMetadata[9]
          ).should.be.true();

          workspaceRepositoryStub.update.calledOnce.should.be.true();
          workspaceRepositoryStub.update.calledWithExactly(
              currentWorkspace).should.be.true();

          messagesStub.pushProgressNew.calledOnce.should.be.true();
          messagesStub.pushProgressNew.firstCall.args.length.should.equal(0);

          messagesStub.pushProgressChanged.calledOnce.should.be.true();
          messagesStub.pushProgressChanged.firstCall.args.length.should
              .equal(0);

          messagesStub.pushProgressDeleted.calledOnce.should.be.true();
          messagesStub.pushProgressDeleted.firstCall.args.length.should
              .equal(0);

          should.deepEqual(output, _.set(status, 'addedDirectories',
            ['/folder1', '/folder2', '/folder2/folder21']));

          done();
        })
        .catch(function (err) {
          done(err);
        });
    });

    it('should run correctly when there are no changes', function (done) {
      var status = {
        added: [],
        changed: [],
        deleted: []
      };
      localServiceStub.status.returns(BPromise.resolve(status));
      localServiceStub.getDirectoriesPath = sinon.stub()
        .returns(BPromise.resolve([]));
      apiPlatformServiceStub.createAPIDirectory = sinon.stub();

      pushController.push()
        .then(function (output) {
          workspaceRepositoryStub.get.calledOnce.should.be.true();
          workspaceRepositoryStub.get.firstCall.args.length.should.equal(0);

          localServiceStub.status.calledOnce.should.be.true();
          localServiceStub.status.firstCall.args.length.should.equal(0);

          apiPlatformServiceStub.getAPIFilesMetadata.calledOnce.should.be.true();
          apiPlatformServiceStub.getAPIFilesMetadata.calledWithExactly(
            currentWorkspace.bizGroup.id,
            currentWorkspace.api.id,
            currentWorkspace.apiVersion.id
          ).should.be.true();

          workspaceRepositoryStub.update.calledOnce.should.be.true();
          workspaceRepositoryStub.update.calledWithExactly(currentWorkspace)
              .should.be.true();

          asserts.notCalled([
            apiPlatformServiceStub.createAPIFile,
            apiPlatformServiceStub.updateAPIFile,
            apiPlatformServiceStub.deleteAPIFile,
            loggerStub.info,
            messagesStub.pushProgressNew,
            messagesStub.pushProgressChanged,
            messagesStub.pushProgressDeleted,
            apiPlatformServiceStub.createAPIDirectory
          ]);

          should.deepEqual(output, _.set(status, 'addedDirectories', []));

          done();
        })
        .catch(function (err) {
          done(err);
        });
    });

    it('should update workspace even when something fails', function (done) {
      localServiceStub.status.returns(BPromise.reject());
      localServiceStub.getDirectoriesPath = sinon.stub();
      apiPlatformServiceStub.createAPIDirectory = sinon.stub();

      pushController.push()
        .then(function () {
          workspaceRepositoryStub.get.calledOnce.should.be.true();
          workspaceRepositoryStub.get.firstCall.args.length.should.equal(0);

          localServiceStub.status.calledOnce.should.be.true();
          localServiceStub.status.firstCall.args.length.should.equal(0);

          workspaceRepositoryStub.update.calledOnce.should.be.true();
          workspaceRepositoryStub.update.calledWithExactly(currentWorkspace)
              .should.be.true();

          asserts.notCalled([
            apiPlatformServiceStub.getAPIFilesMetadata,
            apiPlatformServiceStub.createAPIFile,
            apiPlatformServiceStub.updateAPIFile,
            apiPlatformServiceStub.deleteAPIFile,
            loggerStub.info,
            messagesStub.pushProgressNew,
            messagesStub.pushProgressChanged,
            messagesStub.pushProgressDeleted,
            localServiceStub.getDirectoriesPath,
            apiPlatformServiceStub.createAPIDirectory
          ]);

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
    container.register('localService', localServiceStub);
    container.register('workspaceRepository', workspaceRepositoryStub);
    container.register('logger', loggerStub);
    container.register('messages', messagesStub);

    container.resolve(callback);
  };
}
