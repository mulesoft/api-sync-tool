'use strict';

var BPromise = require('bluebird');

var should = require('should');
var sinon = require('sinon');
var _ = require('lodash');

var containerFactory  = require('../support/testContainerFactory');
var contentGenerator = require('../support/contentGenerator');
var asserts = require('../support/asserts');

var apiPlatformRepositoryStub = {};
var fileSystemRepositoryStub = {};
var contextHolderStub = {};
var decompresserStub = {};
var contextStub = {};
var loggerStub = {};
var messagesStub = {};
var streamStub = {};
var workspace = contentGenerator.generateWorkspace();

var fileData = 'abc';
var apiCreated = 'apiCreated';
var apiVersionCreated = 'apiVersionCreated';
var uploadingRootRaml = 'uploadingRootRaml';
var rootRamlUploaded = 'rootRamlUploaded';
var organizationId = 123;
var versionName = 'version';
var rootRamlPath = 'api.raml';
var apiId = 1;
var newApi = {
  organizationId: organizationId,
  id: apiId,
  version: {
    id: 2
  }
};
var rootRamlFile = {
  id: 1,
  path: rootRamlPath,
  audit: {
    created: {
      date: '2015-12-12 12:00'
    },
    updated: {
      date: '2015-12-12 12:00'
    }
  }
};
var expectedAPI = _.cloneDeep(newApi);
expectedAPI.rootRamlFile = rootRamlFile;

describe('apiPlatformService', function () {
  var directory = '/Users/test';
  var apiFiles = [
    {
      audit: {
        created: {
          date: '2015-07-03 14:50:00'
        },
        updated: {}
      },
      name: 'api.raml',
      path: '/api.raml',
      isDirectory: false
    },
    {
      audit: {
        created: {
          date: '2015-07-03 14:50:00'
        },
        updated: {
          date: '2015-07-02 13:12:00'
        }
      },
      name: 'schema.json',
      path: '/schema.json',
      isDirectory: false
    },
    {
      audit: {
        created: {
          date: '2015-07-03 14:50:00'
        },
        updated: {}
      },
      name: 'temp',
      path: '/temp',
      isDirectory: true
    }
  ];

  beforeEach(function () {
    contextStub.getDirectoryPath = sinon.stub().returns(directory);
    contextHolderStub.get = sinon.stub().returns(contextStub);
  });

  describe('createAPI', run(function (apiPlatformService) {
    var apiName = 'api';

    beforeEach(function () {
      apiPlatformRepositoryStub.createAPI =
        sinon.stub().returns(BPromise.resolve(newApi));
      apiPlatformRepositoryStub.addRootRaml =
        sinon.stub().returns(BPromise.resolve(rootRamlFile));
      fileSystemRepositoryStub.getFile =
        sinon.stub().returns(BPromise.resolve(fileData));

      loggerStub.info = sinon.stub();

      messagesStub.apiCreated = sinon.stub().returns(apiCreated);
      messagesStub.uploadingRootRaml = sinon.stub().returns(uploadingRootRaml);
      messagesStub.rootRamlUploaded = sinon.stub().returns(rootRamlUploaded);
    });

    it('should create an API and set the rootRaml', function (done) {
      apiPlatformService.createAPI(organizationId, apiName, versionName,
          rootRamlPath)
        .then(function (api) {
          asserts.calledOnceWithExactly(apiPlatformRepositoryStub.createAPI, [
            organizationId,
            apiName,
            versionName
          ]);

          checkCreateAPICalls(api);
          asserts.calledOnceWithoutParameters([messagesStub.apiCreated]);
          loggerStub.info.firstCall.calledWithExactly(apiCreated);

          done();
        })
        .catch(function (err) {
          done(err);
        });
    });
  }));

  describe('createAPIVersion', run(function (apiPlatformService) {
    beforeEach(function () {
      apiPlatformRepositoryStub.createAPIVersion =
        sinon.stub().returns(BPromise.resolve(newApi));
      apiPlatformRepositoryStub.addRootRaml =
        sinon.stub().returns(BPromise.resolve(rootRamlFile));
      fileSystemRepositoryStub.getFile =
        sinon.stub().returns(BPromise.resolve(fileData));

      loggerStub.info = sinon.stub();

      messagesStub.apiVersionCreated = sinon.stub().returns(apiVersionCreated);
      messagesStub.uploadingRootRaml = sinon.stub().returns(uploadingRootRaml);
      messagesStub.rootRamlUploaded = sinon.stub().returns(rootRamlUploaded);
    });

    it('should create an API version and set the rootRaml', function (done) {
      apiPlatformService.createAPIVersion(organizationId, apiId, versionName,
          rootRamlPath)
        .then(function (api) {
          asserts.calledOnceWithExactly(
            apiPlatformRepositoryStub.createAPIVersion,
            [
              organizationId,
              apiId,
              versionName
            ]);

          checkCreateAPICalls(api);
          asserts.calledOnceWithoutParameters([messagesStub.apiVersionCreated]);
          loggerStub.info.firstCall.calledWithExactly(apiVersionCreated);

          done();
        })
        .catch(function (err) {
          done(err);
        });
    });
  }));

  describe('getAllAPIs', run(function (apiPlatformService) {
    var apis = [
      {
        id: '12345',
        name: 'api'
      }
    ];

    beforeEach(function () {
      apiPlatformRepositoryStub.getAllAPIs = sinon.stub().returns(
        BPromise.resolve(apis));
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
        BPromise.resolve(apiFiles));
      fileSystemRepositoryStub.createWriteStream = sinon.stub().returns(
        streamStub);
      apiPlatformRepositoryStub.getAPIFiles = sinon.stub().returns(
        BPromise.resolve());
      decompresserStub.decompressFile = sinon.stub().returns(BPromise.resolve());
      fileSystemRepositoryStub.removeFile = sinon.stub().returns(
        BPromise.resolve());
      fileSystemRepositoryStub.getFileFullPath = sinon.stub().returns(
        fileFullPath);
      fileSystemRepositoryStub.getFileHash = sinon.stub().returns(
        BPromise.resolve(fileHash));

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
            [fileFullPath]);

          asserts.calledOnceWithExactly(fileSystemRepositoryStub.removeFile,
            [compressedAPIFilePath]);

          fileSystemRepositoryStub.getFileHash.calledTwice.should.be.true();

          should.deepEqual(result, {
            files: [{
              audit: apiFiles[0].audit,
              path: apiFiles[0].path,
              hash: fileHash
            },
            {
              audit: apiFiles[1].audit,
              path: apiFiles[1].path,
              hash: fileHash
            }],
            directories: [{
              audit: apiFiles[2].audit,
              path: apiFiles[2].path
            }]
          });

          done();
        })
        .catch(function (err) {
          done(err);
        });
    });

    it('should return empty when API has no definition files', function (done) {
      apiPlatformRepositoryStub.getAPIFilesMetadata = sinon.stub().returns(
        BPromise.resolve([]));

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
        BPromise.resolve(apiFiles));

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
      .returns(BPromise.resolve(newDir));

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

  describe('deleteAPIDirectory', run(function (apiPlatformService) {
    var deletedDir = {path: 'x'};
    apiPlatformRepositoryStub.deleteAPIDirectory = sinon.stub()
      .returns(BPromise.resolve(deletedDir));

    it('should pass the call to apiPlatformRepository', function (done) {
      apiPlatformService.deleteAPIDirectory(workspace.bizGroup.id,
          workspace.api.id, workspace.apiVersion.id, deletedDir)
        .then(function (output) {
          should.deepEqual(output, deletedDir);
          asserts.calledOnceWithExactly(
            apiPlatformRepositoryStub.createAPIDirectory, [
              workspace.bizGroup.id,
              workspace.api.id,
              workspace.apiVersion.id,
              deletedDir
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

    var createdFileData = {
      audit: {
        created: {
          date: '2015-07-03 14:50:00'
        },
        updated: {}
      },
      path: newFile.path,
      data: newFileData.data
    };

    var fileHash = 'hash';

    it('should create API file', function (done) {
      fileSystemRepositoryStub.getFile = sinon.stub().returns(
        BPromise.resolve(newFileData));
      apiPlatformRepositoryStub.createAPIFile = sinon.stub().returns(
        BPromise.resolve(createdFileData));
      fileSystemRepositoryStub.getFileHash = sinon.stub().returns(
        BPromise.resolve(fileHash));

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
                audit: createdFileData.audit,
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

    var updatedFileData = {
      audit: {
        created: {
          date: '2015-07-03 14:50:00'
        },
        updated: {}
      },
      path: file.path,
      data: fileData.data
    };

    var fileHash = 'hash';

    it('should update API file', function (done) {
      fileSystemRepositoryStub.getFile = sinon.stub().returns(
        BPromise.resolve(fileData));
      apiPlatformRepositoryStub.updateAPIFile = sinon.stub().returns(
        BPromise.resolve(updatedFileData));
      fileSystemRepositoryStub.getFileHash = sinon.stub().returns(
        BPromise.resolve(fileHash));

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
              audit: updatedFileData.audit,
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
        BPromise.resolve(filePath));

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

function checkCreateAPICalls(api) {
  asserts.calledOnceWithExactly(fileSystemRepositoryStub.getFile, [
    rootRamlPath]);

  asserts.calledOnceWithExactly(apiPlatformRepositoryStub.addRootRaml, [
    newApi.organizationId,
    newApi.id,
    newApi.version.id,
    fileData
  ]);

  asserts.calledOnceWithoutParameters([
    messagesStub.uploadingRootRaml
  ]);
  asserts.calledOnceWithExactly(messagesStub.rootRamlUploaded,
    [rootRamlPath]);

  loggerStub.info.calledThrice.should.be.true();
  loggerStub.info.secondCall.calledWithExactly(uploadingRootRaml);
  loggerStub.info.thirdCall.calledWithExactly(rootRamlUploaded);

  should.deepEqual(api, expectedAPI);
}

function run(callback) {
  return function () {
    var container = containerFactory.createContainer();
    container.register('apiPlatformRepository', apiPlatformRepositoryStub);
    container.register('fileSystemRepository', fileSystemRepositoryStub);
    container.register('contextHolder', contextHolderStub);
    container.register('decompresser', decompresserStub);
    container.register('logger', loggerStub);
    container.register('messages', messagesStub);
    container.resolve(callback);
  };
}
