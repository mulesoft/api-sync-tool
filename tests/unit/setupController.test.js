'use strict';

var BPromise = require('bluebird');

require('should');
var sinon = require('sinon');
var _ = require('lodash');

var asserts = require('../support/asserts');
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
    userOrganizationServiceStub.getBusinessGroups =
      sinon.stub().returns(BPromise.resolve(_.shuffle(organizations)));

    apiPlatformServiceStub.getAllAPIs =
      sinon.stub().returns(BPromise.resolve(apis));

    setupStrategyStub.getBusinessGroup =
      sinon.stub().returns(BPromise.resolve(organizations[1]));
    setupStrategyStub.getAPI =
      sinon.stub().returns(BPromise.resolve(apis[0]));
    setupStrategyStub.getAPIVersion =
      sinon.stub().returns(BPromise.resolve(apis[0].versions[0]));
    setupStrategyStub.getRunPull =
      sinon.stub().returns(BPromise.resolve(true));

    workspaceRepositoryStub.get = sinon.stub().returns(
      BPromise.resolve(currentWorkspace));
    workspaceRepositoryStub.update = sinon.stub().returns(BPromise.resolve());
  });

  describe('setup', run(function (setupController) {
    it('should run correctly', function (done) {
      setupController.setup(setupStrategyStub)
        .then(function (result) {
          // Verify stub calls.
          userOrganizationServiceStub.getBusinessGroups.calledOnce
            .should.be.true();

          asserts.calledOnceWithExactly(setupStrategyStub.getBusinessGroup, [
            sortByName(organizations)]);

          asserts.calledOnceWithExactly(apiPlatformServiceStub.getAllAPIs, [
            organizations[1].id]);

          asserts.calledOnceWithExactly(setupStrategyStub.getAPI, [
            apis]);

          asserts.calledOnceWithExactly(setupStrategyStub.getAPIVersion, [
            sortByName(apis[0].versions)]);

          asserts.calledOnceWithExactly(setupStrategyStub.getRunPull, [
            undefined]);

          asserts.calledOnceWithoutParameters([
            workspaceRepositoryStub.get]);

          asserts.calledOnceWithExactly(workspaceRepositoryStub.update, [
            currentWorkspace]);

          // Assert method response.
          result.should.be.an.Object();

          result.workspace.should.be.an.Object();
          result.workspace.should.have.properties('bizGroup', 'api',
            'apiVersion', 'directory');
          result.workspace.bizGroup.id.should.equal(organizations[1].id);
          result.workspace.api.id.should.equal(apis[0].id);
          result.workspace.apiVersion.id.should.equal(apis[0].versions[0].id);
          result.workspace.directory.should.equal('current');
          result.runPull.should.be.ok();

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

function sortByName(objects) {
  return _.sortBy(objects, 'name');
}
