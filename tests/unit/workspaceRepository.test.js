'use strict';

var should = require('should');
var sinon = require('sinon');
var path = require('path');

var asserts = require('../support/asserts');
var contentGenerator  = require('../support/contentGenerator');
var containerFactory  = require('../support/testContainerFactory');

var errorsStub = {};
var fsStub = {};
var osenvStub = {};
var processStub = {};

describe('workspaceRepository', function () {
  var expectedPath = '/Users/test';
  var anotherPath = '/Users/another';

  var workspaceFilePath = path.join(expectedPath, '.api-sync');
  var fileEncoding = {encoding: 'utf8'};

  var unexpectedPath = '/fail';

  var currentWorkspace = contentGenerator.generateWorkspaceWithFiles();
  currentWorkspace.directory = expectedPath;

  var anotherWorkspace = contentGenerator.generateWorkspace();
  anotherWorkspace.directory = anotherPath;

  var workspacesJSON = JSON.stringify([currentWorkspace, anotherWorkspace]);

  beforeEach(function () {
    errorsStub.WrongDirectoryError = sinon.stub();

    fsStub.readFileSync = sinon.stub();
    fsStub.writeFileSync = sinon.stub();

    processStub.cwd = sinon.stub();

    osenvStub.home = sinon.stub().returns(expectedPath);
  });

  describe('get', run(function (workspaceRepository) {
    it('should return workspace', function (done) {
      fsStub.readFileSync.returns(workspacesJSON);
      processStub.cwd.returns(expectedPath);

      workspaceRepository.get()
        .then(function (workspace) {
          asserts.calledOnceWithoutParameters([
            osenvStub.home
          ]);

          asserts.calledOnceWithExactly(fsStub.readFileSync, [workspaceFilePath,
            fileEncoding]);

          should.deepEqual(workspace, currentWorkspace);

          done();
        })
        .catch(function (err) {
          done(err);
        });
    });

    it('should create workspace when there is not one', function (done) {
      fsStub.readFileSync.onFirstCall().returns('[]');
      processStub.cwd.returns(expectedPath);

      workspaceRepository.get()
        .then(function (workspace) {
          osenvStub.home.calledOnce.should.be.true();

          asserts.calledOnceWithExactly(fsStub.readFileSync, [workspaceFilePath,
            fileEncoding]);

          workspace.should.be.an.Object();
          workspace.directory.should.equal(expectedPath);

          done();
        })
        .catch(function (err) {
          done(err);
        });
    });

    it('should not create workspace file when there is no file',
        function (done) {
      fsStub.readFileSync.throws();
      processStub.cwd.returns(expectedPath);

      workspaceRepository.get()
        .then(function (workspace) {
          osenvStub.home.called.should.be.true();

          asserts.calledOnceWithExactly(fsStub.readFileSync, [workspaceFilePath,
            fileEncoding]);

          asserts.notCalled([fsStub.writeFileSync]);

          workspace.should.be.an.Object();
          workspace.directory.should.equal(expectedPath);

          done();
        })
        .catch(function (err) {
          done(err);
        });
    });
  }));

  describe('update', run(function (workspaceRepository) {
    it('should update workspace', function (done) {
      fsStub.readFileSync.returns(workspacesJSON);
      processStub.cwd.returns(expectedPath);

      currentWorkspace.files.push({
        path: 'newFile.json',
        hash: 'adsfghjk1234'
      });

      workspaceRepository.update(currentWorkspace)
        .then(function () {
          asserts.calledOnceWithExactly(fsStub.readFileSync, [workspaceFilePath,
            fileEncoding]);
          asserts.calledOnceWithExactly(fsStub.writeFileSync, [
            workspaceFilePath,
            JSON.stringify([anotherWorkspace, currentWorkspace]),
            fileEncoding
          ]);

          osenvStub.home.calledTwice.should.be.true();

          done();
        })
        .catch(function (err) {
          done(err);
        });
    });

    it('should fail to update if directories do not match', function (done) {
      fsStub.readFileSync.returns('[]');
      processStub.cwd.returns(unexpectedPath);

      workspaceRepository.update(currentWorkspace)
        .then(function () {
          done('This test should have failed');
        })
        .catch(function () {
          processStub.cwd.calledOnce.should.be.true();
          asserts.notCalled([fsStub.readFileSync, fsStub.writeFileSync]);

          errorsStub.WrongDirectoryError.calledWithNew().should.be.true();

          done();
        })
        .catch(function (err) {
          done(err);
        });
    });
  }));

  describe('del', run(function (workspaceRepository) {
    it('should delete the workspace', function (done) {
      fsStub.readFileSync.returns(workspacesJSON);
      processStub.cwd.returns(expectedPath);

      workspaceRepository.del()
        .then(function () {
          asserts.calledOnceWithExactly(fsStub.readFileSync, [workspaceFilePath,
            fileEncoding]);
          asserts.calledOnceWithExactly(fsStub.writeFileSync, [
            workspaceFilePath,
            JSON.stringify([anotherWorkspace]),
            fileEncoding
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
    container.register('errors', errorsStub);
    container.register('fs', fsStub);
    container.register('osenv', osenvStub);
    container.register('process', processStub);
    container.resolve(callback);
  };
}
