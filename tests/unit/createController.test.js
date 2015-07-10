'use strict';

var BPromise = require('bluebird');
var should = require('should');
var sinon = require('sinon');

var asserts = require('../support/asserts');
var containerFactory  = require('../support/testContainerFactory');

var apiPlatformServiceStub = {};
var fileSystemRepositoryStub = {};
var workspaceRepositoryStub = {};

var directory = 'current';
var rootRamlPath = 'api.raml';
var newApi = {
  bizGroup: 1,
  apiName: 'api',
  apiVersion: 'apiVersion',
  rootRamlPath: rootRamlPath
};
var newApiVersion = {
  bizGroup: 1,
  apiId: 1,
  apiVersion: 'apiVersion',
  rootRamlPath: rootRamlPath
};
var savedApi = {
  api: 1
};
var fileHash = 'abc';
var currentWorkspace = {
  directory: directory,
  files: [{
    path: '/' + newApi.rootRamlPath,
    hash: fileHash
  }]
};

describe('createController', function () {
  beforeEach(function () {
    apiPlatformServiceStub.createAPI =
      sinon.stub().returns(BPromise.resolve(savedApi));
    apiPlatformServiceStub.createAPIVersion =
      sinon.stub().returns(BPromise.resolve(savedApi));

    fileSystemRepositoryStub.getFileHash =
      sinon.stub().returns(BPromise.resolve(fileHash));

    workspaceRepositoryStub.get = sinon.stub().returns(
      BPromise.resolve({directory: directory}));
    workspaceRepositoryStub.update = sinon.stub().returns(BPromise.resolve());
  });

  describe('createAPI', function () {
    it('should create an API', function (done) {
      run(function (createController) {
        createController.createAPI(newApi)
          .then(function (api) {
            should.deepEqual(api, savedApi);

            asserts.calledOnceWithExactly(apiPlatformServiceStub.createAPI, [
              newApi.bizGroup,
              newApi.apiName,
              newApi.apiVersion,
              newApi.rootRamlPath
            ]);

            checkAddRootRaml();

            done();
          })
          .catch(function (err) {
            done(err);
          });
      });
    });
  });

  describe('createAPIVersion', function () {
    it('should create an API version', function (done) {
      run(function (createController) {
        createController.createAPIVersion(newApiVersion)
          .then(function (api) {
            should.deepEqual(api, savedApi);

            asserts.calledOnceWithExactly(apiPlatformServiceStub
                .createAPIVersion, [
              newApiVersion.bizGroup,
              newApiVersion.apiId,
              newApiVersion.apiVersion,
              newApiVersion.rootRamlPath
            ]);

            checkAddRootRaml();

            done();
          })
          .catch(function (err) {
            done(err);
          });
      });
    });
  });
});

function checkAddRootRaml() {
  asserts.calledOnceWithoutParameters([
    workspaceRepositoryStub.get
  ]);
  asserts.calledOnceWithExactly(fileSystemRepositoryStub.getFileHash, [
    rootRamlPath
  ]);
  asserts.calledOnceWithExactly(workspaceRepositoryStub.update, [
    currentWorkspace
  ]);
}

function run(callback) {
  var container = containerFactory.createContainer();
  container.register('apiPlatformService', apiPlatformServiceStub);
  container.register('fileSystemRepository', fileSystemRepositoryStub);
  container.register('workspaceRepository', workspaceRepositoryStub);
  container.resolve(callback);
}
