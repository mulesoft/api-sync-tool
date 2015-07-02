'use strict';

var should = require('should');
var sinon = require('sinon');

var containerFactory  = require('../support/testContainerFactory');
var contentGenerator = require('../support/contentGenerator');
var asserts = require('../support/asserts');

var apiPlatformRepositoryStub = {};
var fileSystemRepositoryStub = {};
var contextHolderStub = {};
var decompresserStub = {};
var contextStub = {};
var streamStub = {};

var workspace = contentGenerator.generateWorkspace();

describe('apiPlatformService', function () {
  var directory = '/Users/test';
  var apiFiles = [
    {
      name: 'api.raml',
      path: '/api.raml',
      isDirectory: false
    },
    {
      name: 'schema.json',
      path: '/schema.json',
      isDirectory: false
    },
    {
      name: 'temp',
      path: '/temp',
      isDirectory: true
    }
  ];

  beforeEach(function () {
    contextStub.getDirectoryPath = sinon.stub().returns(directory);
    contextHolderStub.get = sinon.stub().returns(contextStub);
  });

  describe('getAllAPIs', run(function (apiPlatformService) {
    var apis = [
      {
        id: '12345',
        name: 'api'
      }
    ];

    beforeEach(function () {
      apiPlatformRepositoryStub.getAllAPIs = sinon.stub().returns(
        Promise.resolve(apis));
    });

    it('should return all APIs', function (done) {
      apiPlatformService.getAllAPIs(workspace.bizGroup.id)
        .then(function (allAPIs) {
          asserts.calledOnceWithExactly(apiPlatformRepositoryStub.getAllAPIs, [
            workspace.bizGroup.id
          ]);

          should.deepEqual(allAPIs, apis);

          done();
        })
        .catch(function (err) {
          done(err);
        });
    });
  }));

  describe('getAPIFiles', run(function (apiPlatformService) {
    var fileFullPath = 'fileFullPath';
    var fileHash = 'hash';
    var compressedAPIFilePath = 'API.zip';

    it('should download API Files and store metadata in workspace',
        function (done) {
      apiPlatformRepositoryStub.getAPIFilesMetadata = sinon.stub().returns(
        Promise.resolve(apiFiles));
      fileSystemRepositoryStub.createWriteStream = sinon.stub().returns(
        streamStub);
      apiPlatformRepositoryStub.getAPIFiles = sinon.stub().returns(
        Promise.resolve());
      decompresserStub.decompressFile = sinon.stub().returns(Promise.resolve());
      fileSystemRepositoryStub.removeFile = sinon.stub().returns(
        Promise.resolve());
      fileSystemRepositoryStub.getFileFullPath = sinon.stub().returns(
        fileFullPath);
      fileSystemRepositoryStub.getFileHash = sinon.stub().returns(
        Promise.resolve(fileHash));

      apiPlatformService.getAPIFiles(workspace.bizGroup.id, workspace.api.id,
          workspace.apiVersion.id)
        .then(function (result) {
          asserts.calledOnceWithExactly(
            apiPlatformRepositoryStub.getAPIFilesMetadata,
            [workspace.bizGroup.id, workspace.api.id, workspace.apiVersion.id]);

          asserts.calledOnceWithExactly(
            fileSystemRepositoryStub.createWriteStream,
            [compressedAPIFilePath]);

          asserts.calledOnceWithExactly(apiPlatformRepositoryStub.getAPIFiles, [
            workspace.bizGroup.id,
            workspace.api.id,
            workspace.apiVersion.id,
            streamStub
          ]);

          asserts.calledOnceWithExactly(
            fileSystemRepositoryStub.getFileFullPath, [compressedAPIFilePath]);

          asserts.calledOnceWithExactly(decompresserStub.decompressFile,
            [directory, fileFullPath]);

          asserts.calledOnceWithExactly(fileSystemRepositoryStub.removeFile,
            [compressedAPIFilePath]);

          fileSystemRepositoryStub.getFileHash.calledTwice.should.be.true();

          result.should.be.an.Array();
          result.length.should.equal(2);
          result[0].path.should.equal(apiFiles[0].path);
          result[0].hash.should.equal(fileHash);
          result[1].path.should.equal(apiFiles[1].path);
          result[1].hash.should.equal(fileHash);

          done();
        })
        .catch(function (err) {
          done(err);
        });
    });

    it('should return empty when API has no definition files', function (done) {
      apiPlatformRepositoryStub.getAPIFilesMetadata = sinon.stub().returns(
        Promise.resolve([]));

      apiPlatformService.getAPIFiles(workspace.bizGroup.id, workspace.api.id,
          workspace.apiVersion.id)
        .then(function (result) {
          asserts.calledOnceWithExactly(
            apiPlatformRepositoryStub.getAPIFilesMetadata,
            [workspace.bizGroup.id, workspace.api.id, workspace.apiVersion.id]);

          result.should.be.an.Array();
          result.length.should.equal(0);

          done();
        })
        .catch(function (err) {
          done(err);
        });
    });
  }));

  describe('getAPIFilesMetadata', run(function (apiPlatformService) {
    it('should return API definition files metadata', function (done) {
      apiPlatformRepositoryStub.getAPIFilesMetadata = sinon.stub().returns(
        Promise.resolve(apiFiles));

        apiPlatformService.getAPIFilesMetadata(workspace.bizGroup.id,
            workspace.api.id, workspace.apiVersion.id)
          .then(function (filesMetadata) {
            asserts.calledOnceWithExactly(
              apiPlatformRepositoryStub.getAPIFilesMetadata, [
                workspace.bizGroup.id,
                workspace.api.id,
                workspace.apiVersion.id
              ]);

            should.deepEqual(filesMetadata, apiFiles);
            done();
          })
          .catch(function (err) {
            done(err);
          });
    });
  }));

  describe('createAPIDirectory', run(function (apiPlatformService) {
    var newDir = {path: 'x'};
    apiPlatformRepositoryStub.createAPIDirectory = sinon.stub()
      .returns(Promise.resolve(newDir));

    it('should pass the call to apiPlatformRepository', function (done) {
      apiPlatformService.createAPIDirectory(workspace.bizGroup.id,
          workspace.api.id, workspace.apiVersion.id, newDir)
        .then(function (output) {
          should.deepEqual(output, newDir);
          asserts.calledOnceWithExactly(
            apiPlatformRepositoryStub.createAPIDirectory, [
              workspace.bizGroup.id,
              workspace.api.id,
              workspace.apiVersion.id,
              newDir
            ]);

          done();
        })
        .catch(function (err) {
          done(err);
        });
    });
  }));

  describe('createAPIFile', run(function (apiPlatformService) {
    var newFile = {
      path: 'schema.json',
      parentId: 1234
    };

    var newFileData = {
      path: newFile.path,
      data: 'asdasd'
    };

    var fileHash = 'hash';

    it('should create API file', function (done) {
      fileSystemRepositoryStub.getFile = sinon.stub().returns(
        Promise.resolve(newFileData));
      apiPlatformRepositoryStub.createAPIFile = sinon.stub().returns(
        Promise.resolve(newFileData));
      fileSystemRepositoryStub.getFileHash = sinon.stub().returns(
        Promise.resolve(fileHash));

        apiPlatformService.createAPIFile(workspace.bizGroup.id,
            workspace.api.id, workspace.apiVersion.id, newFile)
          .then(function (createdFile) {
            asserts.calledOnceWithExactly(fileSystemRepositoryStub.getFile,
              [newFile.path]);

            asserts.calledOnceWithExactly(
              apiPlatformRepositoryStub.createAPIFile, [
                workspace.bizGroup.id,
                workspace.api.id,
                workspace.apiVersion.id,
                {
                  path: newFile.path,
                  data: newFileData.data,
                  parentId: newFile.parentId
                }
              ]);

              should.deepEqual(createdFile, {
                path: newFile.path,
                hash: fileHash
              });

            done();
          })
          .catch(function (err) {
            done(err);
          });
    });
  }));

  describe('updateAPIFile', run(function (apiPlatformService) {
    var file = {
      path: 'schema.json',
      parentId: 1234
    };

    var fileData = {
      path: file.path,
      data: 'asdasd'
    };

    var fileHash = 'hash';

    it('should update API file', function (done) {
      fileSystemRepositoryStub.getFile = sinon.stub().returns(
        Promise.resolve(fileData));
      apiPlatformRepositoryStub.updateAPIFile = sinon.stub().returns(
        Promise.resolve(fileData.path));
      fileSystemRepositoryStub.getFileHash = sinon.stub().returns(
        Promise.resolve(fileHash));

        apiPlatformService.updateAPIFile(workspace.bizGroup.id,
            workspace.api.id, workspace.apiVersion.id, file)
          .then(function (updatedFile) {
            asserts.calledOnceWithExactly(fileSystemRepositoryStub.getFile,
              [file.path]);

            asserts.calledOnceWithExactly(
              apiPlatformRepositoryStub.updateAPIFile, [
                workspace.bizGroup.id,
                workspace.api.id,
                workspace.apiVersion.id,
                {
                  path: file.path,
                  data: fileData.data,
                  parentId: file.parentId
                }
              ]);

            should.deepEqual(updatedFile, {
              path: file.path,
              hash: fileHash
            });

            done();
          })
          .catch(function (err) {
            done(err);
          });
    });
  }));

  describe('deleteAPIFile', run(function (apiPlatformService) {
    var filePath = 'schema.json';

    it('should delete API file', function (done) {
      apiPlatformRepositoryStub.deleteAPIFile = sinon.stub().returns(
        Promise.resolve(filePath));

        apiPlatformService.deleteAPIFile(workspace.bizGroup.id,
            workspace.api.id, workspace.apiVersion.id, filePath)
          .then(function () {
            asserts.calledOnceWithExactly(
              apiPlatformRepositoryStub.deleteAPIFile, [
                workspace.bizGroup.id,
                workspace.api.id,
                workspace.apiVersion.id,
                filePath
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
    container.register('apiPlatformRepository', apiPlatformRepositoryStub);
    container.register('fileSystemRepository', fileSystemRepositoryStub);
    container.register('contextHolder', contextHolderStub);
    container.register('decompresser', decompresserStub);
    container.resolve(callback);
  };
}
