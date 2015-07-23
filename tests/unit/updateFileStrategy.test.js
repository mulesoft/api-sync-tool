'use strict';

var BPromise = require('bluebird');

var should = require('should');
var sinon = require('sinon');
var _ = require('lodash');

var asserts = require('../support/asserts');
var containerFactory  = require('../support/testContainerFactory');
var contentGenerator = require('../support/contentGenerator');

var apiPlatformServiceStub = {};
var loggerStub = {};
var messagesStub = {};

var uploadingFile = 'uploadingFile';

describe('updateFileStrategy', function () {
  beforeEach(function () {
    apiPlatformServiceStub.updateAPIFile = sinon.stub();

    loggerStub.info = sinon.stub();

    messagesStub.uploadingFile = sinon.stub().returns(uploadingFile);
  });

  describe('update', run(function (updateFileStrategy) {
    var changedFile;
    var remoteFiles;
    var resultingWorkspace;
    var workspace;

    beforeEach(function () {
      workspace = contentGenerator.generateWorkspaceWithFiles(2);
      var updatedFile = workspace.files[0];
      changedFile = updatedFile.path;
      var changedFileResult = {
        audit: {
          updated: {
            date: 'date'
          }
        },
        path: updatedFile.path
      };

      remoteFiles = contentGenerator.getAPIFilesMetadata(2);

      apiPlatformServiceStub.updateAPIFile
        .returns(BPromise.resolve(changedFileResult));

      var changedFileResultWorkspace = _.cloneDeep(changedFileResult);
      changedFileResultWorkspace.audit = {
        created: updatedFile.audit.created,
        updated: changedFileResult.audit.updated
      };
      resultingWorkspace = _.cloneDeep(workspace);
      resultingWorkspace.files = [
        workspace.files[1],
        changedFileResultWorkspace
      ];
    });

    it('should run correctly', function (done) {
      updateFileStrategy.update(changedFile, remoteFiles, workspace)
        .then(function () {
          asserts.calledOnceWithExactly(apiPlatformServiceStub.updateAPIFile, [
            workspace.bizGroup.id,
            workspace.api.id,
            workspace.apiVersion.id,
            remoteFiles[0]
          ]);

          asserts.calledOnceWithExactly(messagesStub.uploadingFile, [
            changedFile
          ]);

          asserts.calledOnceWithExactly(loggerStub.info, [
            uploadingFile
          ]);
          should.deepEqual(workspace, resultingWorkspace);

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

    container.resolve(callback);
  };
}
