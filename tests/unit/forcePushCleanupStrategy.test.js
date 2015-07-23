'use strict';

var BPromise = require('bluebird');

require('should');
var sinon = require('sinon');
var _ = require('lodash');

var asserts = require('../support/asserts');
var containerFactory  = require('../support/testContainerFactory');
var contentGenerator = require('../support/contentGenerator');

var apiPlatformServiceStub = {};
var loggerStub = {};
var messagesStub = {};
var updateFileStrategyStub = {};
var workspaceRepositoryStub = {};

describe('forcePushCleanupStrategy', function () {
  var deletingAllDirectoriesMessage = 'deletingAllDirectoriesMessage';
  var deletingDirectory = 'deletingDirectory';
  var deletingAllFilesMessage = 'deletingAllFilesMessage';
  var deletingFile = 'deletingFile';
  var uploadingRootRaml = 'uploadingRootRaml';

  var apiFilesMetadata;
  var currentWorkspace;
  var directory1;
  var directory2on1;
  var fileOnDirectory2;
  var originalWorkspace;
  var rootRaml;
  var rootRamlId;
  var updatedWorkspace;

  beforeEach(function () {
    apiFilesMetadata = [];
    directory1 = {
      audit: {
        created: {
          date: '2015-10-05 00:05:00'
        },
        updated: {}
      },
      id: 100,
      isDirectory: true,
      path: 'directory1'
    };
    directory2on1 = {
      audit: {
        created: {
          date: '2015-10-05 00:05:00'
        },
        updated: {}
      },
      id: 101,
      isDirectory: true,
      path: 'directory1/directory2'
    };
    fileOnDirectory2 = {
      audit: {
        created: {
          date: '2015-10-05 00:05:00'
        },
        updated: {}
      },
      id: 102,
      path: 'directory1/directory2/file.raml'
    };
    rootRamlId = 1001;
    rootRaml = {
      audit: {
        created: {
          date: '2015-10-05 00:05:00'
        },
        updated: {}
      },
      id: rootRamlId,
      path: 'root.raml'
    };
    var apis = contentGenerator.generateApis(1);
    var api = apis[0];
    api.versions[0].rootFileId = rootRamlId;

    currentWorkspace  = contentGenerator.generateWorkspaceWithFiles();
    currentWorkspace.api.id = 1;
    currentWorkspace.apiVersion.id = 1;
    currentWorkspace.files.push(rootRaml);
    currentWorkspace.directories.push(directory1);
    currentWorkspace.directories.push(directory2on1);
    originalWorkspace = _.cloneDeep(currentWorkspace);
    updatedWorkspace = _.cloneDeep(currentWorkspace);
    updatedWorkspace.files = [rootRaml];
    updatedWorkspace.directories = [];

    apiFilesMetadata.push(directory1);
    apiFilesMetadata.push(directory2on1);
    apiFilesMetadata.push(fileOnDirectory2);
    apiFilesMetadata.push(rootRaml);

    apiPlatformServiceStub.deleteAPIFile = sinon.stub();
    apiPlatformServiceStub.deleteAPIDirectory = sinon.stub();
    apiPlatformServiceStub.getAllAPIs = sinon.stub().returns(apis);
    apiPlatformServiceStub.getAPIFilesMetadata = sinon.stub().returns(
      BPromise.resolve(apiFilesMetadata));

    loggerStub.info = sinon.stub();

    messagesStub.deletingAllDirectoriesMessage =
      sinon.stub().returns(deletingAllDirectoriesMessage);
    messagesStub.deletingDirectory = sinon.stub().returns(deletingDirectory);
    messagesStub.deletingAllFilesMessage =
      sinon.stub().returns(deletingAllFilesMessage);
    messagesStub.deletingFile = sinon.stub().returns(deletingFile);
    messagesStub.uploadingRootRaml = sinon.stub().returns(uploadingRootRaml);

    updateFileStrategyStub.update = sinon.stub();

    workspaceRepositoryStub.get = sinon.stub().returns(
      BPromise.resolve(currentWorkspace));
    workspaceRepositoryStub.update = sinon.stub().returns(BPromise.resolve());
  });

  describe('cleanup', run(function (forcePushCleanupStrategy) {
    it('should run correctly', function (done) {
      forcePushCleanupStrategy.cleanup()
        .then(function () {
          asserts.calledOnceWithoutParameters([
            workspaceRepositoryStub.get,
            messagesStub.deletingAllDirectoriesMessage,
            messagesStub.deletingAllFilesMessage,
            messagesStub.uploadingRootRaml
          ]);

          asserts.calledOnceWithExactly(apiPlatformServiceStub.getAllAPIs, [
            currentWorkspace.bizGroup.id
          ]);

          asserts.calledOnceWithExactly(
              apiPlatformServiceStub.getAPIFilesMetadata, [
            currentWorkspace.bizGroup.id,
            currentWorkspace.api.id,
            currentWorkspace.apiVersion.id
          ]);

          loggerStub.info.callCount.should.equal(6);
          loggerStub.info.firstCall.calledWithExactly(deletingAllFilesMessage);
          loggerStub.info.secondCall.calledWithExactly(deletingFile);

          asserts.calledOnceWithExactly(messagesStub.deletingFile, [
            fileOnDirectory2.path
          ]);

          asserts.calledOnceWithExactly(
              apiPlatformServiceStub.deleteAPIFile, [
            currentWorkspace.bizGroup.id,
            currentWorkspace.api.id,
            currentWorkspace.apiVersion.id,
            fileOnDirectory2
          ]);

          apiPlatformServiceStub.deleteAPIDirectory.calledTwice.should.be.true();
          apiPlatformServiceStub.deleteAPIDirectory.firstCall.calledWithExactly(
            currentWorkspace.bizGroup.id,
            currentWorkspace.api.id,
            currentWorkspace.apiVersion.id,
            directory2on1
          ).should.be.true();
          apiPlatformServiceStub.deleteAPIDirectory.secondCall.calledWithExactly(
            currentWorkspace.bizGroup.id,
            currentWorkspace.api.id,
            currentWorkspace.apiVersion.id,
            directory1
          ).should.be.true();

          loggerStub.info.thirdCall.calledWithExactly(deletingAllDirectoriesMessage);
          loggerStub.info.getCall(3).calledWithExactly(deletingDirectory);
          loggerStub.info.getCall(4).calledWithExactly(deletingDirectory);

          messagesStub.deletingDirectory.calledTwice.should.be.true();
          messagesStub.deletingDirectory.firstCall.calledWithExactly(directory2on1.path);
          messagesStub.deletingDirectory.secondCall.calledWithExactly(directory1.path);

          asserts.calledOnceWithExactly(updateFileStrategyStub.update, [
            rootRaml.path,
            _.reject(apiFilesMetadata, 'isDirectory'),
            currentWorkspace
          ]);

          loggerStub.info.getCall(5).calledWithExactly(uploadingRootRaml);
          asserts.calledOnceWithExactly(workspaceRepositoryStub.update, [
            updatedWorkspace
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
    container.register('logger', loggerStub);
    container.register('messages', messagesStub);
    container.register('updateFileStrategy', updateFileStrategyStub);
    container.register('workspaceRepository', workspaceRepositoryStub);

    container.resolve(callback);
  };
}
