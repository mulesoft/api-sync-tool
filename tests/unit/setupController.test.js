'use strict';

require('should');
var sinon = require('sinon');

var containerFactory  = require('../support/testContainerFactory');
var contentGenerator = require('../support/contentGenerator');

var apiPlatformServiceStub = {};
var userOrganizationServiceStub = {};
var workspaceRepositoryStub = {};
var setupStrategyStub = {};

var organizations = contentGenerator.generateBusinessGroups();
var apis = contentGenerator.generateApis();

var currentWorkspace = {
  directory: 'current'
};

describe('setupController', function () {
  beforeEach(function () {
    userOrganizationServiceStub.getBusinessGroups = sinon.stub().returns(Promise.resolve(organizations));
    setupStrategyStub.getBusinessGroup = sinon.stub().returns(Promise.resolve(organizations[1]));
    apiPlatformServiceStub.getAllAPIs = sinon.stub().returns(Promise.resolve(apis));
    setupStrategyStub.getAPI = sinon.stub().returns(Promise.resolve(apis[0]));
    setupStrategyStub.getAPIVersion = sinon.stub().returns(Promise.resolve(apis[0].versions[0]));
    setupStrategyStub.getRunPull = sinon.stub().returns(Promise.resolve(true));
    workspaceRepositoryStub.get = sinon.stub().returns(currentWorkspace);
    workspaceRepositoryStub.update = sinon.stub().returns({});
  });

  describe('setup', run(function (setupController) {
    it('should run correctly', function (done) {
      setupController.setup(setupStrategyStub)
        .then(function (result) {
          // Verify stub calls.
          userOrganizationServiceStub.getBusinessGroups.called.should.be.true;
          setupStrategyStub.getBusinessGroup.called.should.be.true;
          setupStrategyStub.getBusinessGroup.firstCall.args[0].should.be.an.Array;

          apiPlatformServiceStub.getAllAPIs.called.should.be.true;
          apiPlatformServiceStub.getAllAPIs.firstCall.args[0].should.equal(organizations[1].id);

          setupStrategyStub.getAPI.called.should.be.true;
          setupStrategyStub.getAPI.firstCall.args[0].should.be.an.Array;

          setupStrategyStub.getAPIVersion.called.should.be.true;
          setupStrategyStub.getAPIVersion.firstCall.args[0].should.be.an.Object;

          workspaceRepositoryStub.get.called.should.be.true;

          workspaceRepositoryStub.update.called.should.be.true;
          workspaceRepositoryStub.update.firstCall.args[0].should.be.an.Object;

          // Assert method response.
          result.should.be.an.Object;

          result.workspace.should.be.an.Object;
          result.workspace.should.have.properties('bizGroup', 'api', 'apiVersion', 'directory');
          result.workspace.bizGroup.id.should.equal(organizations[1].id);
          result.workspace.api.id.should.equal(apis[0].id);
          result.workspace.apiVersion.id.should.equal(apis[0].versions[0].id);
          result.workspace.directory.should.equal('current');
          result.runPull.should.be.ok;

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
    container.register('userOrganizationService', userOrganizationServiceStub);
    container.register('workspaceRepository', workspaceRepositoryStub);
    container.resolve(callback);
  };
}
