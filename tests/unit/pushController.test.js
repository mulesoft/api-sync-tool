'use strict';

require('should');
var sinon = require('sinon');

var asserts = require('../support/asserts');
var containerFactory  = require('../support/testContainerFactory');
var contentGenerator = require('../support/contentGenerator');

var apiFactoryStub = {};
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
      Promise.resolve(currentWorkspace));
    localServiceStub.status = sinon.stub();

    apiPlatformServiceStub.getAPIFilesMetadata = sinon.stub().returns(
      Promise.resolve(apiFilesMetadata));

    apiFactoryStub.create = sinon.stub().returns({});

    apiPlatformServiceStub.createAPIFile = sinon.stub().returns(
      Promise.resolve(currentWorkspace.files[0]));
    apiPlatformServiceStub.updateAPIFile = sinon.stub().returns(
      Promise.resolve(currentWorkspace.files[1]));
    apiPlatformServiceStub.deleteAPIFile = sinon.stub().returns(
      Promise.resolve(currentWorkspace.files[2].path));

    workspaceRepositoryStub.update = sinon.stub().returns(Promise.resolve());
    loggerStub.info = sinon.stub();

    messagesStub.pushProgressNew = sinon.stub().returns(newMessage);
    messagesStub.pushProgressChanged = sinon.stub().returns(changedMessage);
    messagesStub.pushProgressDeleted = sinon.stub().returns(deletedMessage);
  });

  describe('push', run(function (pushController) {
    it('should run correctly', function (done) {
      var status = {
        added: [currentWorkspace.files[0].path],
        changed: [currentWorkspace.files[1].path],
        deleted: [currentWorkspace.files[2].path]
      };
      localServiceStub.status.returns(Promise.resolve(status));

      pushController.push()
        .then(function () {
          // Verify stub calls.
          workspaceRepositoryStub.get.calledOnce.should.be.true;
          workspaceRepositoryStub.get.firstCall.args.length.should.equal(0);

          localServiceStub.status.calledOnce.should.be.true;
          localServiceStub.status.firstCall.args.length.should.equal(0);

          apiPlatformServiceStub.getAPIFilesMetadata.calledOnce.should.be.true;
          apiPlatformServiceStub.getAPIFilesMetadata.calledWithExactly(
            currentWorkspace.bizGroup.id,
            currentWorkspace.api.id,
            currentWorkspace.apiVersion.id
          ).should.be.true;

          apiPlatformServiceStub.createAPIFile.calledOnce.should.be.true;
          apiPlatformServiceStub.createAPIFile.calledWithExactly(
            currentWorkspace.bizGroup.id,
            currentWorkspace.api.id,
            currentWorkspace.apiVersion.id,
            sinon.match({
              path: currentWorkspace.files[0].path,
              parentId: null
            })
          ).should.be.true;

          apiPlatformServiceStub.updateAPIFile.calledOnce.should.be.true;
          apiPlatformServiceStub.updateAPIFile.calledWithExactly(
            currentWorkspace.bizGroup.id,
            currentWorkspace.api.id,
            currentWorkspace.apiVersion.id,
            apiFilesMetadata[1]
          ).should.be.true;

          apiPlatformServiceStub.deleteAPIFile.calledOnce.should.be.true;
          apiPlatformServiceStub.deleteAPIFile.calledWithExactly(
            currentWorkspace.bizGroup.id,
            currentWorkspace.api.id,
            currentWorkspace.apiVersion.id,
            apiFilesMetadata[2]
          ).should.be.true;

          workspaceRepositoryStub.update.calledOnce.should.be.true;
          workspaceRepositoryStub.update.calledWithExactly(
              currentWorkspace).should.be.true;

          loggerStub.info.calledThrice.should.be.true;
          loggerStub.info.firstCall.calledWithExactly(newMessage)
              .should.be.true;
          loggerStub.info.secondCall.calledWithExactly(changedMessage)
              .should.be.true;
          loggerStub.info.thirdCall.calledWithExactly(deletedMessage)
              .should.be.true;

          messagesStub.pushProgressNew.calledOnce.should.be.true;
          messagesStub.pushProgressNew.firstCall.args.length.should.equal(0);

          messagesStub.pushProgressChanged.calledOnce.should.be.true;
          messagesStub.pushProgressChanged.firstCall.args.length.should
              .equal(0);

          messagesStub.pushProgressDeleted.calledOnce.should.be.true;
          messagesStub.pushProgressDeleted.firstCall.args.length.should
              .equal(0);

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
      localServiceStub.status.returns(Promise.resolve(status));

      pushController.push()
        .then(function () {
          // Verify stub calls.
          // These methods should be called.
          workspaceRepositoryStub.get.calledOnce.should.be.true;
          workspaceRepositoryStub.get.firstCall.args.length.should.equal(0);

          localServiceStub.status.calledOnce.should.be.true;
          localServiceStub.status.firstCall.args.length.should.equal(0);

          apiPlatformServiceStub.getAPIFilesMetadata.calledOnce.should.be.true;
          apiPlatformServiceStub.getAPIFilesMetadata.calledWithExactly(
            currentWorkspace.bizGroup.id,
            currentWorkspace.api.id,
            currentWorkspace.apiVersion.id
          ).should.be.true;

          workspaceRepositoryStub.update.calledOnce.should.be.true;
          workspaceRepositoryStub.update.calledWithExactly(currentWorkspace)
              .should.be.true;

          // All these should not
          asserts.notCalled([
            apiPlatformServiceStub.createAPIFile,
            apiPlatformServiceStub.updateAPIFile,
            apiPlatformServiceStub.deleteAPIFile,
            loggerStub.info,
            messagesStub.pushProgressNew,
            messagesStub.pushProgressChanged,
            messagesStub.pushProgressDeleted
          ]);

          done();
        })
        .catch(function (err) {
          done(err);
        });
    });

    it('should update workspace even when something fails', function (done) {
      localServiceStub.status.returns(Promise.reject());

      pushController.push()
        .then(function () {
          // Verify stub calls.
          // These methods should be called.
          workspaceRepositoryStub.get.calledOnce.should.be.true;
          workspaceRepositoryStub.get.firstCall.args.length.should.equal(0);

          localServiceStub.status.calledOnce.should.be.true;
          localServiceStub.status.firstCall.args.length.should.equal(0);

          workspaceRepositoryStub.update.calledOnce.should.be.true;
          workspaceRepositoryStub.update.calledWithExactly(currentWorkspace)
              .should.be.true;

          // All these should not
          asserts.notCalled([
            apiPlatformServiceStub.getAPIFilesMetadata,
            apiPlatformServiceStub.createAPIFile,
            apiPlatformServiceStub.updateAPIFile,
            apiPlatformServiceStub.deleteAPIFile,
            loggerStub.info,
            messagesStub.pushProgressNew,
            messagesStub.pushProgressChanged,
            messagesStub.pushProgressDeleted
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
    container.register('apimFactory', apiFactoryStub);
    container.register('apiPlatformService', apiPlatformServiceStub);
    container.register('localService', localServiceStub);
    container.register('workspaceRepository', workspaceRepositoryStub);
    container.register('logger', loggerStub);
    container.register('messages', messagesStub);

    container.resolve(callback);
  };
}
