'use strict';

require('should');
var sinon = require('sinon');

var containerFactory  = require('../support/testContainerFactory');
var contentGenerator = require('../support/contentGenerator');
var asserts = require('../support/asserts');

var contextHolderStub = {};
var errorsStub = {};
var superagentStub = {};
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
    errorsStub.WritingFileError = sinon.stub();

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
    var responseStub = {};
    var pipingStub = {};
    beforeEach(function () {
      responseStub.pipe = sinon.stub().returns(pipingStub);
      pipingStub.on = sinon.stub();
    });

    it('should return all API Files', function (done) {
      superagentStub.end.callsArgWith(0, null, responseStub);

      pipingStub.on.onFirstCall().callsArg(1);

      apiPlatformRepository.getAPIFiles(workspace.bizGroup.id, workspace.api.id,
          workspace.apiVersion.id)
        .then(function () {
          asserts.calledOnceWithExactly(superagentStub.get, [
            sinon.match('/organizations/' + workspace.bizGroup.id + '/apis/' +
              workspace.api.id + '/versions/' + workspace.apiVersion.id +
              '/files/export')
          ]);

          assertReadAPICalls();

          done();
        })
        .catch(function (err) {
          done(err);
        });
    });

    it('should fail when response has error', function (done) {
      superagentStub.end.callsArgWith(0, 'error');

      apiPlatformRepository.getAPIFiles(workspace.bizGroup.id, workspace.api.id,
          workspace.apiVersion.id)
        .then(function () {
          done('Should have failed');
        })
        .catch(function (err) {
          asserts.calledOnceWithExactly(superagentStub.get, [
            sinon.match('/organizations/' + workspace.bizGroup.id + '/apis/' +
              workspace.api.id + '/versions/' + workspace.apiVersion.id +
              '/files/export')
          ]);

          assertReadAPICalls();

          err.should.equal('error');

          done();
        })
        .catch(function (err) {
          done(err);
        });
    });

    it('should fail when there is a writing error', function (done) {
      superagentStub.end.callsArgWith(0, null, responseStub);
      pipingStub.on.onSecondCall().callsArg(1);

      apiPlatformRepository.getAPIFiles(workspace.bizGroup.id, workspace.api.id,
          workspace.apiVersion.id)
        .then(function () {
          done('Should have failed');
        })
        .catch(function () {
          asserts.calledOnceWithExactly(superagentStub.get, [
            sinon.match('/organizations/' + workspace.bizGroup.id + '/apis/' +
              workspace.api.id + '/versions/' + workspace.apiVersion.id +
              '/files/export')
          ]);

          assertReadAPICalls();

          errorsStub.WritingFileError.calledWithNew().should.be.true;

          done();
        })
        .catch(function (err) {
          done(err);
        });
    });
  }));

  describe('getAPIFilesMetadata', run(function (apiPlatformRepository) {
    it('should return all API files metadata', function (done) {
      superagentStub.end.returns(Promise.resolve({
        body: []
      }));

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
});

function assertReadAPICalls() {
  superagentStub.set.calledTwice.should.be.true;
  superagentStub.set.firstCall.calledWithExactly(
    'Authorization', 'Bearer ' + token).should.be.true;
  superagentStub.set.secondCall.calledWithExactly(
    'Accept', 'application/json').should.be.true;

  superagentStub.end.calledOnce.should.be.true;
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
    container.register('errors', errorsStub);
    container.resolve(callback);
  };
}
