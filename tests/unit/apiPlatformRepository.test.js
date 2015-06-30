'use strict';

var should = require('should');
var sinon = require('sinon');

var containerFactory  = require('../support/testContainerFactory');
var contentGenerator = require('../support/contentGenerator');
var asserts = require('../support/asserts');

var contextHolderStub = {};
var errorsStub = {};
var superagentStub = {};
var superagentCallbacksStub = {};
var contextStub = {};
var token = '1234567asdf';
var workspace = contentGenerator.generateWorkspace();

describe('apiPlatformRepository', function () {
  beforeEach(function () {
    superagentStub.get = sinon.stub().returnsThis();
    superagentStub.post = sinon.stub().returnsThis();
    superagentStub.put = sinon.stub().returnsThis();
    superagentStub.del = sinon.stub().returnsThis();
    superagentStub.send = sinon.stub().returnsThis();
    superagentStub.set = sinon.stub().returnsThis();
    superagentStub.query = sinon.stub().returnsThis();
    superagentStub.end = sinon.stub();

    errorsStub.LoginError = sinon.stub();
    errorsStub.BadCredentialsError = sinon.stub();
    errorsStub.DownloadFileError = sinon.stub();
    errorsStub.WriteFileError = sinon.stub();

    contextStub.getToken = sinon.stub().returns(token);
    contextHolderStub.get = sinon.stub().returns(contextStub);
  });

  describe('getAllAPIs', run(function (apiPlatformRepository) {
    it('should return all APIs', function (done) {
      superagentStub.end.returns(Promise.resolve({
        body: {
          apis: [{
            id: 1,
            name: 'name1',

            versions: [{
              id: 1,
              name: 'version1'
            }]
          }]
        }
      }));

      apiPlatformRepository.getAllAPIs(workspace.bizGroup.id)
        .then(function (allAPIs) {
          asserts.calledOnceWithExactly(superagentStub.get, [
            sinon.match('/organizations/' + workspace.bizGroup.id + '/apis/')
          ]);

          asserts.calledOnceWithExactly(superagentStub.query,
            [{sort: 'name', ascending: true}]);

          assertReadAPICalls();

          allAPIs.should.be.an.Array;
          allAPIs[0].should.be.an.Object;
          allAPIs[0].id.should.equal(1);
          allAPIs[0].name.should.equal('name1');

          done();
        })
        .catch(function (err) {
          done(err);
        });
    });

    it('should manage errors correctly', function (done) {
      superagentStub.end.returns(Promise.reject({
        status: 401
      }));

      apiPlatformRepository.getAllAPIs(workspace.bizGroup.id)
        .then(function () {
          done('Should have failed');
        })
        .catch(function () {
          asserts.calledOnceWithExactly(superagentStub.get, [
            sinon.match('/organizations/' + workspace.bizGroup.id + '/apis/')
          ]);

          asserts.calledOnceWithExactly(superagentStub.query,
            [{sort: 'name', ascending: true}]);

          assertReadAPICalls();

          errorsStub.BadCredentialsError.calledWithNew().should.be.true;

          done();
        })
        .catch(function (err) {
          done(err);
        });
    });
  }));

  describe('getAPIFiles', run(function (apiPlatformRepository) {
    var streamStub = {};
    beforeEach(function () {
      superagentCallbacksStub.get = sinon.stub().returnsThis();
      superagentCallbacksStub.set = sinon.stub().returnsThis();
      superagentCallbacksStub.pipe = sinon.stub().returnsThis();
      superagentCallbacksStub.on = sinon.stub().returnsThis();
      streamStub.on = sinon.stub().returns();
    });

    it('should return all API Files', function (done) {
      superagentCallbacksStub.on.onSecondCall().callsArgOn(1,
        {
          res: {
            statusCode: 200
          }
        }
      ).returnsThis();
      streamStub.on.onFirstCall().callsArg(1);

      apiPlatformRepository.getAPIFiles(workspace.bizGroup.id, workspace.api.id,
          workspace.apiVersion.id, streamStub)
        .then(function () {
          asserts.calledOnceWithExactly(superagentCallbacksStub.get, [
            sinon.match('/organizations/' + workspace.bizGroup.id + '/apis/' +
              workspace.api.id + '/versions/' + workspace.apiVersion.id +
              '/files/export')
          ]);

          checkEventsRegister();
          assertReadAPICallbacksCalls();
          asserts.calledOnceWithExactly(superagentCallbacksStub.pipe, [
            streamStub
          ]);

          done();
        })
        .catch(function (err) {
          done(err);
        });
    });

    it('should fail if downloading the file to disk fails', function (done) {
      superagentCallbacksStub.on.onFirstCall().callsArg(1).returnsThis();

      apiPlatformRepository.getAPIFiles(workspace.bizGroup.id, workspace.api.id,
          workspace.apiVersion.id, streamStub)
        .then(function () {
          done('Should have failed');
        })
        .catch(function () {
          asserts.calledOnceWithExactly(superagentCallbacksStub.get, [
            sinon.match('/organizations/' + workspace.bizGroup.id + '/apis/' +
              workspace.api.id + '/versions/' + workspace.apiVersion.id +
              '/files/export')
          ]);

          checkEventsRegister();
          assertReadAPICallbacksCalls();
          asserts.calledOnceWithExactly(superagentCallbacksStub.pipe, [
            streamStub
          ]);

          errorsStub.WriteFileError.calledWithNew().should.be.true;

          done();
        })
        .catch(function (err) {
          done(err);
        });
    });

    it('should fail if writing the file to disk fails', function (done) {
      streamStub.on.onSecondCall().callsArg(1);

      apiPlatformRepository.getAPIFiles(workspace.bizGroup.id, workspace.api.id,
          workspace.apiVersion.id, streamStub)
        .then(function () {
          done('Should have failed');
        })
        .catch(function () {
          asserts.calledOnceWithExactly(superagentCallbacksStub.get, [
            sinon.match('/organizations/' + workspace.bizGroup.id + '/apis/' +
              workspace.api.id + '/versions/' + workspace.apiVersion.id +
              '/files/export')
          ]);

          checkEventsRegister();
          assertReadAPICallbacksCalls();
          asserts.calledOnceWithExactly(superagentCallbacksStub.pipe, [
            streamStub
          ]);

          errorsStub.WriteFileError.calledWithNew().should.be.true;

          done();
        })
        .catch(function (err) {
          done(err);
        });
    });

    it('should fail if the authentication fails', function (done) {
      superagentCallbacksStub.res = {statusCode: 401};
      superagentCallbacksStub.on.onSecondCall()
        .callsArgOn(1, superagentCallbacksStub);

      apiPlatformRepository.getAPIFiles(workspace.bizGroup.id, workspace.api.id,
          workspace.apiVersion.id, streamStub)
        .then(function () {
          done('Should have failed');
        })
        .catch(function () {
          asserts.calledOnceWithExactly(superagentCallbacksStub.get, [
            sinon.match('/organizations/' + workspace.bizGroup.id + '/apis/' +
              workspace.api.id + '/versions/' + workspace.apiVersion.id +
              '/files/export')
          ]);

          checkEventsRegister();
          assertReadAPICallbacksCalls();
          asserts.calledOnceWithExactly(superagentCallbacksStub.pipe, [
            streamStub
          ]);

          errorsStub.BadCredentialsError.calledWithNew().should.be.true;

          done();
        })
        .catch(function (err) {
          done(err);
        });
    });

    it('should fail if the get fails', function (done) {
      superagentCallbacksStub.on.onSecondCall()
        .callsArgOn(1, {
          res: {
            statusCode: 1
          }
        });

      apiPlatformRepository.getAPIFiles(workspace.bizGroup.id, workspace.api.id,
          workspace.apiVersion.id, streamStub)
        .then(function () {
          done('Should have failed');
        })
        .catch(function () {
          asserts.calledOnceWithExactly(superagentCallbacksStub.get, [
            sinon.match('/organizations/' + workspace.bizGroup.id + '/apis/' +
              workspace.api.id + '/versions/' + workspace.apiVersion.id +
              '/files/export')
          ]);

          checkEventsRegister();
          assertReadAPICallbacksCalls();
          asserts.calledOnceWithExactly(superagentCallbacksStub.pipe, [
            streamStub
          ]);

          errorsStub.DownloadFileError.calledWithNew().should.be.true;

          done();
        })
        .catch(function (err) {
          done(err);
        });
    });

    function checkEventsRegister() {
      streamStub.on.calledTwice.should.be.true;
      streamStub.on.firstCall.calledWithExactly('finish', sinon.match.func)
        .should.be.true;
      streamStub.on.secondCall.calledWithExactly('error', sinon.match.func)
          .should.be.true;

      superagentCallbacksStub.on.calledTwice.should.be.true;
      superagentCallbacksStub.on.firstCall
        .calledWithExactly('error', sinon.match.func).should.be.true;
      superagentCallbacksStub.on.secondCall
        .calledWithExactly('end', sinon.match.func).should.be.true;
    }
  }));

  describe('getAPIFilesMetadata', run(function (apiPlatformRepository) {
    it('should return all API files metadata', function (done) {
      var apiFilesMetadata = [
        {
          path: '/api.raml',
          name: 'api.raml',
          isDirectory: false
        },
        {
          path: '/api.raml.meta',
          name: 'api.raml.meta',
          isDirectory: false
        },
        {
          path: '/schema.json',
          name: 'schema.json',
          isDirectory: false
        },
        {
          path: '/schema.json.meta',
          name: 'schema.json.meta',
          isDirectory: false
        }
      ];
      superagentStub.end.returns(Promise.resolve({
        body: apiFilesMetadata}));

      apiPlatformRepository.getAPIFilesMetadata(workspace.bizGroup.id,
          workspace.api.id, workspace.apiVersion.id)
        .then(function (allFiles) {
          asserts.calledOnceWithExactly(superagentStub.get, [
            sinon.match('/organizations/' + workspace.bizGroup.id + '/apis/' +
              workspace.api.id + '/versions/' + workspace.apiVersion.id +
              '/files')
          ]);

          assertReadAPICalls();

          allFiles.should.be.an.Array;
          allFiles.length.should.equal(2);
          should.deepEqual(allFiles[0], apiFilesMetadata[0]);
          should.deepEqual(allFiles[1], apiFilesMetadata[2]);

          done();
        })
        .catch(function (err) {
          done(err);
        });
    });

    it('should manage errors correctly', function (done) {
      superagentStub.end.returns(Promise.reject({
        status: 401
      }));

      apiPlatformRepository.getAPIFilesMetadata(workspace.bizGroup.id,
          workspace.api.id, workspace.apiVersion.id)
        .then(function () {
          done('Should have failed');
        })
        .catch(function () {
          asserts.calledOnceWithExactly(superagentStub.get, [
            sinon.match('/organizations/' + workspace.bizGroup.id + '/apis/' +
              workspace.api.id + '/versions/' + workspace.apiVersion.id +
              '/files')
          ]);

          assertReadAPICalls();

          errorsStub.BadCredentialsError.calledWithNew().should.be.true;

          done();
        })
        .catch(function (err) {
          done(err);
        });
    });
  }));

  describe('createResource', run(function (apiPlatformRepository) {
    var newDir = {
      path: '/test',
      parentId: null
    };
    var createdDirId = 12345;

    var newFile = {
      path: '/test',
      parentId: null,
      data: 'content'
    };
    var createdFileId = 54312;

    it('should create the specified dir', function (done) {
      superagentStub.end.returns(Promise.resolve({
        body: {
          id: createdDirId
        }
      }));

      apiPlatformRepository.createAPIDir(workspace.bizGroup.id,
          workspace.api.id, workspace.apiVersion.id, newDir)
        .then(function (createdDir) {
          asserts.calledOnceWithExactly(superagentStub.post, [
            sinon.match('/organizations/' + workspace.bizGroup.id + '/apis/' +
              workspace.api.id + '/versions/' + workspace.apiVersion.id +
              '/files')
          ]);

          assertWriteAPICalls(sinon.match({
            parentId: newDir.parentId,
            path: newDir.path,
            isDirectory: true
          }));

          createdDir.should.be.an.Object;
          createdDir.path.should.equal(newDir.path);
          createdDir.id.should.equal(createdDirId);

          done();
        })
        .catch(function (err) {
          done(err);
        });
    });

    it('should create the specified file', function (done) {
      superagentStub.end.returns(Promise.resolve({
        body: {
          id: createdFileId
        }
      }));

      apiPlatformRepository.createAPIFile(workspace.bizGroup.id,
          workspace.api.id, workspace.apiVersion.id, newFile)
        .then(function (createdFile) {
          asserts.calledOnceWithExactly(superagentStub.post, [
            sinon.match('/organizations/' + workspace.bizGroup.id + '/apis/' +
              workspace.api.id + '/versions/' + workspace.apiVersion.id +
              '/files')
          ]);

          assertWriteAPICalls(sinon.match({
            parentId: newFile.parentId,
            path: newFile.path,
            isDirectory: false
          }));

          createdFile.should.be.an.Object;
          createdFile.path.should.equal(newFile.path);
          createdFile.id.should.equal(createdFileId);

          done();
        })
        .catch(function (err) {
          done(err);
        });
    });

    it('should manage errors correctly', function (done) {
      superagentStub.end.returns(Promise.reject({
        status: 401
      }));

      apiPlatformRepository.createAPIDir(workspace.bizGroup.id,
          workspace.api.id, workspace.apiVersion.id, newDir)
        .then(function () {
          done('Should have failed');
        })
        .catch(function () {
          asserts.calledOnceWithExactly(superagentStub.post, [
            sinon.match('/organizations/' + workspace.bizGroup.id + '/apis/' +
              workspace.api.id + '/versions/' + workspace.apiVersion.id +
              '/files')
          ]);

          assertWriteAPICalls(sinon.match({
            parentId: newDir.parentId,
            path: newDir.path,
            isDirectory: true
          }));

          errorsStub.BadCredentialsError.calledWithNew().should.be.true;

          done();
        })
        .catch(function (err) {
          done(err);
        });
    });
  }));

  describe('updateAPIFile', run(function (apiPlatformRepository) {
    var file = {
      id: 123,
      path: '/test',
      parentId: null,
      data: 'content'
    };

    it('should update the specified file', function (done) {
      superagentStub.end.returns(Promise.resolve({
        body: []
      }));

      apiPlatformRepository.updateAPIFile(workspace.bizGroup.id,
          workspace.api.id, workspace.apiVersion.id, file)
        .then(function (updatedFile) {
          asserts.calledOnceWithExactly(superagentStub.put, [
            sinon.match('/organizations/' + workspace.bizGroup.id + '/apis/' +
              workspace.api.id + '/versions/' + workspace.apiVersion.id +
              '/files/' + file.id)
          ]);

          assertWriteAPICalls(sinon.match({
            id: file.id,
            parentId: file.parentId,
            path: file.path,
            data: file.data
          }));

          updatedFile.should.be.a.String;
          updatedFile.should.equal(file.path);

          done();
        })
        .catch(function (err) {
          done(err);
        });
    });

    it('should manage errors correctly', function (done) {
      superagentStub.end.returns(Promise.reject({
        status: 401
      }));

      apiPlatformRepository.updateAPIFile(workspace.bizGroup.id,
          workspace.api.id, workspace.apiVersion.id, file)
        .then(function () {
          done('Should have failed');
        })
        .catch(function () {
          asserts.calledOnceWithExactly(superagentStub.put, [
            sinon.match('/organizations/' + workspace.bizGroup.id + '/apis/' +
              workspace.api.id + '/versions/' + workspace.apiVersion.id +
              '/files/' + file.id)
          ]);

          assertWriteAPICalls(sinon.match({
            id: file.id,
            parentId: file.parentId,
            path: file.path,
            data: file.data
          }));

          errorsStub.BadCredentialsError.calledWithNew().should.be.true;

          done();
        })
        .catch(function (err) {
          done(err);
        });
    });
  }));

  describe('deleteAPIFile', run(function (apiPlatformRepository) {
    var file = {
      id: 123,
      path: '/test',
      parentId: null,
      data: 'content'
    };

    it('should delete the specified file', function (done) {
      superagentStub.end.returns(Promise.resolve({
        body: []
      }));

      apiPlatformRepository.deleteAPIFile(workspace.bizGroup.id,
          workspace.api.id, workspace.apiVersion.id, file)
        .then(function (updatedFile) {
          asserts.calledOnceWithExactly(superagentStub.del, [
            sinon.match('/organizations/' + workspace.bizGroup.id + '/apis/' +
              workspace.api.id + '/versions/' + workspace.apiVersion.id +
              '/files/' + file.id)
          ]);

          assertReadAPICalls();

          updatedFile.should.be.a.String;
          updatedFile.should.equal(file.path);

          done();
        })
        .catch(function (err) {
          done(err);
        });
    });

    it('should manage errors correctly', function (done) {
      superagentStub.end.returns(Promise.reject({
        status: 401
      }));

      apiPlatformRepository.deleteAPIFile(workspace.bizGroup.id,
          workspace.api.id, workspace.apiVersion.id, file)
        .then(function () {
          done('Should have failed');
        })
        .catch(function () {
          asserts.calledOnceWithExactly(superagentStub.del, [
            sinon.match('/organizations/' + workspace.bizGroup.id + '/apis/' +
              workspace.api.id + '/versions/' + workspace.apiVersion.id +
              '/files/' + file.id)
          ]);

          assertReadAPICalls();

          errorsStub.BadCredentialsError.calledWithNew().should.be.true;

          done();
        })
        .catch(function (err) {
          done(err);
        });
    });
  }));

  describe('checkUnauthorized', run(function (apiPlatformRepository) {
    var file = {
      id: 123,
      path: '/test',
      parentId: null,
      data: 'content'
    };

    it('should manage unknown errors correctly', function (done) {
      var customError = {
        status: 400
      };
      superagentStub.end.returns(Promise.reject(customError));

      apiPlatformRepository.deleteAPIFile(workspace.bizGroup.id,
          workspace.api.id, workspace.apiVersion.id, file)
        .then(function () {
          done('Should have failed');
        })
        .catch(function (error) {
          asserts.calledOnceWithExactly(superagentStub.del, [
            sinon.match('/organizations/' + workspace.bizGroup.id + '/apis/' +
              workspace.api.id + '/versions/' + workspace.apiVersion.id +
              '/files/' + file.id)
          ]);

          assertReadAPICalls();

          should.deepEqual(error, customError);

          done();
        })
        .catch(function (err) {
          done(err);
        });
    });
  }));
});

function assertReadAPICalls() {
  superagentStub.set.calledTwice.should.be.true;
  superagentStub.set.firstCall.calledWithExactly(
    'Authorization', 'Bearer ' + token).should.be.true;
  superagentStub.set.secondCall.calledWithExactly(
    'Accept', 'application/json').should.be.true;

  superagentStub.end.calledOnce.should.be.true;
}

function assertReadAPICallbacksCalls() {
  superagentCallbacksStub.set.calledTwice.should.be.true;
  superagentCallbacksStub.set.firstCall.calledWithExactly(
    'Authorization', 'Bearer ' + token).should.be.true;
    superagentCallbacksStub.set.secondCall.calledWithExactly(
    'Accept', 'application/json').should.be.true;
}

function assertWriteAPICalls(args) {
  superagentStub.set.calledThrice.should.be.true;
  superagentStub.set.firstCall.calledWithExactly(
    'Content-Type', 'application/json').should.be.true;
  superagentStub.set.secondCall.calledWithExactly(
    'Authorization', 'Bearer ' + token).should.be.true;
  superagentStub.set.thirdCall.calledWithExactly(
    'Accept', 'application/json').should.be.true;

  asserts.calledOnceWithExactly(superagentStub.send, [args]);

  superagentStub.end.calledOnce.should.be.true;
}

function run(callback) {
  return function () {
    var container = containerFactory.createContainer();
    container.register('contextHolder', contextHolderStub);
    container.register('superagent', superagentStub);
    container.register('superagentCallbacks', superagentCallbacksStub);
    container.register('errors', errorsStub);
    container.resolve(callback);
  };
}
