'use strict';

var BPromise = require('bluebird');
require('should');
var sinon = require('sinon');
var _ = require('lodash');

var asserts = require('../support/asserts');
var containerFactory  = require('../support/testContainerFactory');

var apiPlatformServiceStub = {};
var fileSystemRepositoryStub = {};
var localServiceStub = {};
var loggerStub = {};
var messagesStub = {};
var parametersStrategyStub = {};
var userOrganizationServiceStub = {};
var workspaceRepositoryStub = {};

describe('createController', function () {
  var rootRamlHash = 'abc';
  var businessGroup = {
    id: 1
  };
  var businessGroups = [
    businessGroup
  ];
  var existingAPI = {
    id: 1,
    name: 'api'
  };
  var apis = [
    existingAPI
  ];
  var newApiName = 'newApi';
  var newApiVersionName = 'newApiVersionName';
  var rootRamlPath = '/api.raml';
  var files = [
    '/api.raml',
    '/folder1/x.raml'
  ];
  var rootRamlFile = {
    id: 1,
    audit: {
      created: {
        date: '2015-12-12 12:00'
      },
      updated: {
        date: '2015-12-12 12:00'
      }
    },
    path: rootRamlPath
  };
  var rootRamlFileWithHash = _.clone(rootRamlFile);
  rootRamlFileWithHash.hash = rootRamlHash;

  var createdApi = {
    id: 2,
    name: newApiName,
    versions: [{
      id: 1,
      name: newApiVersionName
    }],
    rootRamlFile: rootRamlFile
  };
  var directory = 'pepe';
  var workspace = {
    directory: directory
  };
  var updatedWorkspace = {
    directory: directory,
    files: [rootRamlFileWithHash],
    directories: []
  };

  beforeEach(function () {
    apiPlatformServiceStub.getAllAPIs =
      sinon.stub().returns(BPromise.resolve(apis));

    fileSystemRepositoryStub.getFileHash =
      sinon.stub().returns(BPromise.resolve(rootRamlHash));

    localServiceStub.getFilesPath =
      sinon.stub().returns(BPromise.resolve(files));

    loggerStub.info =
      sinon.stub().returns();

    parametersStrategyStub.getBusinessGroup =
      sinon.stub().returns(BPromise.resolve(businessGroup));
    parametersStrategyStub.getAPIVersionName =
      sinon.stub().returns(BPromise.resolve(newApiVersionName));
    parametersStrategyStub.getRootRamlPath =
      sinon.stub().returns(BPromise.resolve(rootRamlPath));

    userOrganizationServiceStub.getBusinessGroups =
      sinon.stub().returns(BPromise.resolve(businessGroups));

    workspaceRepositoryStub.get =
      sinon.stub().returns(BPromise.resolve(workspace));
    workspaceRepositoryStub.update = sinon.stub().returns(BPromise.resolve());
  });

  describe('createAPI', function () {
    var creatingAPI = 'creatingAPI';

    beforeEach(function () {
      apiPlatformServiceStub.createAPI =
        sinon.stub().returns(BPromise.resolve(createdApi));

      messagesStub.creatingAPI = sinon.stub().returns(creatingAPI);

      parametersStrategyStub.getCreateAPIorAPIVersionChoice =
        sinon.stub().returns(BPromise.resolve(true));
      parametersStrategyStub.getAPIName =
        sinon.stub().returns(BPromise.resolve(newApiName));
    });

    it('should create an API', function (done) {
      run(function (createController) {
        createController.create(parametersStrategyStub)
          .then(function (newApi) {
            assertCommonCreateStrategy(newApi, undefined);

            asserts.calledOnceWithExactly(parametersStrategyStub.getAPIName, [
              apis
            ]);

            asserts.calledOnceWithoutParameters([
              messagesStub.creatingAPI
            ]);

            asserts.calledOnceWithExactly(loggerStub.info, [
              creatingAPI
            ]);

            asserts.calledOnceWithExactly(apiPlatformServiceStub.createAPI, [
              businessGroup.id,
              newApiName,
              newApiVersionName,
              rootRamlPath
            ]);

            done();
          })
          .catch(function (err) {
            done(err);
          });
      });
    });
  });

  describe('createAPIVersion', function () {
    var creatingAPIVersion = 'creatingAPIVersion';

    beforeEach(function () {
      apiPlatformServiceStub.createAPIVersion =
        sinon.stub().returns(BPromise.resolve(createdApi));

      messagesStub.creatingAPIVersion = sinon.stub().returns(creatingAPIVersion);

      parametersStrategyStub.getCreateAPIorAPIVersionChoice =
        sinon.stub().returns(BPromise.resolve(false));
      parametersStrategyStub.getAPI =
        sinon.stub().returns(BPromise.resolve(existingAPI));
    });

    it('should create an API version', function (done) {
      run(function (createController) {
        createController.create(parametersStrategyStub)
          .then(function (newApi) {
            assertCommonCreateStrategy(newApi, existingAPI.id);

            asserts.calledOnceWithExactly(parametersStrategyStub.getAPI, [
              apis
            ]);

            asserts.calledOnceWithoutParameters([
              messagesStub.creatingAPIVersion
            ]);

            asserts.calledOnceWithExactly(loggerStub.info, [
              creatingAPIVersion
            ]);

            asserts.calledOnceWithExactly(apiPlatformServiceStub.createAPI, [
              businessGroup.id,
              newApiName,
              newApiVersionName,
              rootRamlPath
            ]);

            done();
          })
          .catch(function (err) {
            done(err);
          });
      });
    });
  });

  function assertCommonCreateStrategy(newApi, apiId) {
    newApi.should.equal(createdApi);
    asserts.calledOnceWithExactly(
      parametersStrategyStub.getCreateAPIorAPIVersionChoice, [businessGroup]);
    asserts.calledOnceWithoutParameters([
      userOrganizationServiceStub.getBusinessGroups,
      workspaceRepositoryStub.get
    ]);

    asserts.calledOnceWithExactly(parametersStrategyStub
        .getBusinessGroup, [
      businessGroups
    ]);

    asserts.calledOnceWithExactly(apiPlatformServiceStub.getAllAPIs, [
      businessGroup.id
    ]);

    asserts.calledOnceWithExactly(parametersStrategyStub
        .getAPIVersionName, [
      apis,
      apiId
    ]);

    asserts.calledOnceWithExactly(localServiceStub.getFilesPath, [
      newApiVersionName
    ]);

    asserts.calledOnceWithExactly(parametersStrategyStub
        .getRootRamlPath, [
      ['/api.raml']
    ]);

    asserts.calledOnceWithExactly(fileSystemRepositoryStub.getFileHash, [
      rootRamlPath
    ]);

    asserts.calledOnceWithExactly(workspaceRepositoryStub.update, [
      updatedWorkspace
    ]);
  }
});

function run(callback) {
  var container = containerFactory.createContainer();
  container.register('apiPlatformService', apiPlatformServiceStub);
  container.register('fileSystemRepository', fileSystemRepositoryStub);
  container.register('localService', localServiceStub);
  container.register('logger', loggerStub);
  container.register('messages', messagesStub);
  container.register('userOrganizationService', userOrganizationServiceStub);
  container.register('workspaceRepository', workspaceRepositoryStub);
  container.resolve(callback);
}
