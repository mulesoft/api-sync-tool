'use strict';

var should = require('should');
var sinon = require('sinon');

var containerFactory  = require('../support/testContainerFactory');
var contentGenerator = require('../support/contentGenerator');

var apiPlatformRepositoryStub = {};

var workspace;
var newDir = {
  path: '/test',
  id: 10
};

var newDir2 = {
  path: '/test',
  id: 20
};

var newDir3 = {
  path: '/test',
  id: 30
};

describe('apiFileFactory', function () {
  beforeEach(function () {
    workspace = contentGenerator.generateWorkspaceWithFiles();

    apiPlatformRepositoryStub.createAPIDir = sinon.stub();
  });

  describe('create', run(function (apiFileFactory) {
    it('should return file without parent id', function (done) {
      var fileName = '/test.json';
      apiFileFactory.create(workspace.bizGroup.id, workspace.api.id,
          workspace.apiVersion.id, fileName, workspace.files)
        .then(function (result) {
          apiPlatformRepositoryStub.createAPIDir.called.should.not.be.true;

          result.should.be.an.Object;
          result.path.should.equal(fileName);
          should(result.parentId).not.be.true;

          done();
        })
        .catch(function (err) {
          done(err);
        });
    });

    it('should create a directory if it does not exist', function (done) {
      var fileName = '/test/test.json';
      apiPlatformRepositoryStub.createAPIDir.returns(newDir);

      apiFileFactory.create(workspace.bizGroup.id, workspace.api.id,
          workspace.apiVersion.id, fileName, workspace.files)
        .then(function (result) {
          apiPlatformRepositoryStub.createAPIDir.calledOnce.should.be.true;
          apiPlatformRepositoryStub.createAPIDir.calledWithExactly(
            workspace.bizGroup.id,
            workspace.api.id,
            workspace.apiVersion.id,
            sinon.match({
              path: '/test',
              parentId: null
            }));

          result.should.be.an.Object;
          result.path.should.equal(fileName);
          result.parentId.should.equal(10);

          workspace.files.should.containEql(newDir);

          done();
        })
        .catch(function (err) {
          done(err);
        });
    });

    it('should create all required directories if they do not exist', function (done) {
      var fileName = '/test/second/third/test.json';
      apiPlatformRepositoryStub.createAPIDir.onFirstCall().returns(newDir);
      apiPlatformRepositoryStub.createAPIDir.onSecondCall().returns(newDir2);
      apiPlatformRepositoryStub.createAPIDir.onThirdCall().returns(newDir3);

      apiFileFactory.create(workspace.bizGroup.id, workspace.api.id,
          workspace.apiVersion.id, fileName, workspace.files)
        .then(function (result) {
          apiPlatformRepositoryStub.createAPIDir.calledThrice.should.be.true;
          apiPlatformRepositoryStub.createAPIDir.firstCall.calledWithExactly(
            workspace.bizGroup.id,
            workspace.api.id,
            workspace.apiVersion.id,
            sinon.match({
              path: '/test',
              parentId: null
            }));

          apiPlatformRepositoryStub.createAPIDir.secondCall.calledWithExactly(
            workspace.bizGroup.id,
            workspace.api.id,
            workspace.apiVersion.id,
            sinon.match({
              path: '/second',
              parentId: 10
            }));

          apiPlatformRepositoryStub.createAPIDir.thirdCall.calledWithExactly(
            workspace.bizGroup.id,
            workspace.api.id,
            workspace.apiVersion.id,
            sinon.match({
              path: '/third',
              parentId: 20
            }));

          result.should.be.an.Object;
          result.path.should.equal(fileName);
          result.parentId.should.equal(30);

          workspace.files.should.containEql(newDir);

          done();
        })
        .catch(function (err) {
          done(err);
        });
    });

    it('should reuse a directory if it exists', function (done) {
      var fileName = '/test/test.json';
      workspace.files.push(newDir);

      apiFileFactory.create(workspace.bizGroup.id, workspace.api.id,
          workspace.apiVersion.id, fileName, workspace.files)
        .then(function (result) {
          apiPlatformRepositoryStub.createAPIDir.called.should.not.be.true;

          result.should.be.an.Object;
          result.path.should.equal(fileName);
          result.parentId.should.equal(newDir.id);

          done();
        })
        .catch(function (err) {
          done(err);
        });
    });

    it('should work when some dirs exist and other do not', function (done) {
      var fileName = '/test/second/third/test.json';
      workspace.files.push(newDir);

      apiPlatformRepositoryStub.createAPIDir.onFirstCall().returns(newDir2);
      apiPlatformRepositoryStub.createAPIDir.onSecondCall().returns(newDir3);

      apiFileFactory.create(workspace.bizGroup.id, workspace.api.id,
          workspace.apiVersion.id, fileName, workspace.files)
        .then(function (result) {
          apiPlatformRepositoryStub.createAPIDir.calledTwice.should.be.true;

          apiPlatformRepositoryStub.createAPIDir.firstCall.calledWithExactly(
            workspace.bizGroup.id,
            workspace.api.id,
            workspace.apiVersion.id,
            sinon.match({
              path: '/second',
              parentId: 10
            }));

          apiPlatformRepositoryStub.createAPIDir.secondCall.calledWithExactly(
            workspace.bizGroup.id,
            workspace.api.id,
            workspace.apiVersion.id,
            sinon.match({
              path: '/third',
              parentId: 20
            }));

          result.should.be.an.Object;
          result.path.should.equal(fileName);
          result.parentId.should.equal(30);

          workspace.files.should.containEql(newDir);

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
    container.resolve(callback);
  };
}
