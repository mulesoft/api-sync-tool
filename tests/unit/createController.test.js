'use strict';

var BPromise = require('bluebird');
var should = require('should');
var sinon = require('sinon');
var _ = require('lodash');
var path = require('path');

var asserts = require('../support/asserts');
var containerFactory  = require('../support/testContainerFactory');

var apiPlatformServiceStub = {};
var fileSystemRepositoryStub = {};
var workspaceRepositoryStub = {};

var currentWorkspace = {
  directory: 'current'
};

var newApi = {
  bizGroup: 1,
  api: 'api',
  apiVersion: 'apiVersion',
  rootRamlPath: 'api.raml'
};

var savedApi = {
  api: 1
};

var fileHash = 'abc';

describe('createController', function () {
  beforeEach(function () {
    apiPlatformServiceStub.createAPI =
      sinon.stub().returns(BPromise.resolve(savedApi));

    fileSystemRepositoryStub.getFileHash =
      sinon.stub().returns(BPromise.resolve(fileHash));

    workspaceRepositoryStub.get = sinon.stub().returns(
      BPromise.resolve(currentWorkspace));
    workspaceRepositoryStub.update = sinon.stub().returns(BPromise.resolve());
  });

  describe('create', run(function (createController) {
    it('should run correctly', function (done) {
      createController.create(newApi)
        .then(function (api) {
          should.deepEqual(api, savedApi);

          asserts.calledOnceWithoutParameters([
            workspaceRepositoryStub.get]);

          asserts.calledOnceWithExactly(fileSystemRepositoryStub.getFileHash, [
            newApi.rootRamlPath]);

          asserts.calledOnceWithExactly(workspaceRepositoryStub.update, [
            _.set(currentWorkspace, 'files', {
              path: path.sep + api.rootRamlPath,
              hash: fileHash
            })]);

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
    container.register('fileSystemRepository', fileSystemRepositoryStub);
    container.register('workspaceRepository', workspaceRepositoryStub);
    container.resolve(callback);
  };
}
