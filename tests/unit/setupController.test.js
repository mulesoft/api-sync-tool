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
    userOrganizationServiceStub.getBusinessGroups = sinon.stub().returns(
        Promise.resolve(organizations));

    apiPlatformServiceStub.getAllAPIs = sinon.stub().returns(Promise.resolve(
        apis));

    setupStrategyStub.getBusinessGroup = sinon.stub().returns(Promise.resolve(
        organizations[1]));
    setupStrategyStub.getAPI = sinon.stub().returns(Promise.resolve(apis[0]));
    setupStrategyStub.getAPIVersion = sinon.stub().returns(Promise.resolve(
        apis[0].versions[0]));
    setupStrategyStub.getRunPull = sinon.stub().returns(Promise.resolve(true));

    workspaceRepositoryStub.get = sinon.stub().returns(currentWorkspace);
    workspaceRepositoryStub.update = sinon.stub().returns({});
  });

  describe('setup', run(function (setupController) {
    it('should run correctly', function (done) {
      setupController.setup(setupStrategyStub)
        .then(function (result) {
          // Verify stub calls.
          userOrganizationServiceStub.getBusinessGroups.calledOnce
              .should.be.true;

          setupStrategyStub.getBusinessGroup.calledOnce.should.be.true;
          setupStrategyStub.getBusinessGroup.calledWithExactly(organizations)
              .should.be.true;

          apiPlatformServiceStub.getAllAPIs.calledOnce.should.be.true;
          apiPlatformServiceStub.getAllAPIs
              .calledWithExactly(organizations[1].id).should.be.true;

          setupStrategyStub.getAPI.calledOnce.should.be.true;
          setupStrategyStub.getAPI.calledWithExactly(apis).should.be.true;

          setupStrategyStub.getAPIVersion.calledOnce.should.be.true;
          setupStrategyStub.getAPIVersion.calledWithExactly(apis[0])
              .should.be.true;

          setupStrategyStub.getRunPull.calledOnce.should.be.true;

          workspaceRepositoryStub.get.calledOnce.should.be.true;

          workspaceRepositoryStub.update.calledOnce.should.be.true;
          workspaceRepositoryStub.update.calledWithExactly(currentWorkspace)
              .should.be.true;

          // Assert method response.
          result.should.be.an.Object;

          result.workspace.should.be.an.Object;
          result.workspace.should.have.properties('bizGroup', 'api',
              'apiVersion', 'directory');
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
