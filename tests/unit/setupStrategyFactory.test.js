'use strict';

require('should');
var sinon = require('sinon');

var containerFactory = require('../support/testContainerFactory');
var contentGenerator = require('../support/contentGenerator');

var commandPromptStub = {};
var messagesStub = {};

var businessGroups = contentGenerator.generateBusinessGroups();
var apis = contentGenerator.generateApis();
var batchParameters = {
  bizGroup: 1,
  api: 1,
  apiVersion: 1
};

describe('setupStrategyFactory', function () {
  describe('interactive', run(function (setupStrategyFactory) {
    beforeEach(function () {
      messagesStub.businessGroupPromptMessage = sinon.stub().returns('Select bizGroup');
      messagesStub.apiPromptMessage = sinon.stub().returns('Select API');
      messagesStub.apiVersionPromptMessage = sinon.stub().returns('Select API Version');

      commandPromptStub.getChoice = sinon.stub()
        .withArgs(sinon.match.any, 'name', 'id', sinon.match.any);
    });

    it('should return selected business group', function (done) {
      // Setup return value for stub method.
      commandPromptStub.getChoice.returns(Promise.resolve(businessGroups[0]));

      var strategy = setupStrategyFactory.get({isInteractive: true});

      strategy.getBusinessGroup(businessGroups)
        .then(function (selectedBusinessGroup) {
          selectedBusinessGroup.should.be.an.Object;
          selectedBusinessGroup.id.should.be.equal(1);

          commandPromptStub.getChoice.called.should.be.true;

          done();
        })
        .catch(function (err) {
          done(err);
        });
    });

    it('should return selected api', function (done) {
      // Setup return value for stub method.
      commandPromptStub.getChoice.returns(Promise.resolve(apis[0]));

      var strategy = setupStrategyFactory.get({isInteractive: true});

      strategy.getAPI(apis)
        .then(function (selectedAPI) {
          selectedAPI.should.be.an.Object;
          selectedAPI.id.should.be.equal(1);

          commandPromptStub.getChoice.called.should.be.true;

          done();
        })
        .catch(function (err) {
          done(err);
        });
    });

    it('should return selected api version', function (done) {
      // Setup return value for stub method.
      commandPromptStub.getChoice.returns(Promise.resolve(apis[0].versions[0]));

      var strategy = setupStrategyFactory.get({isInteractive: true});

      strategy.getAPIVersion(apis[0])
        .then(function (selectedAPIVersion) {
          selectedAPIVersion.should.be.an.Object;
          selectedAPIVersion.id.should.be.equal(1);

          commandPromptStub.getChoice.called.should.be.true;

          done();
        })
        .catch(function (err) {
          done(err);
        });
    });
  }));

  describe('batch', run(function (setupStrategyFactory) {
    it('should return selected business group', function (done) {
      var strategy = setupStrategyFactory.get(batchParameters);

      strategy.getBusinessGroup(businessGroups)
        .then(function (selectedBusinessGroup) {
          selectedBusinessGroup.should.be.an.Object;
          selectedBusinessGroup.id.should.be.equal(1);

          done();
        })
        .catch(function (err) {
          done(err);
        });
    });

    it('should return selected API', function (done) {
      var strategy = setupStrategyFactory.get(batchParameters);

      strategy.getAPI(apis)
        .then(function (selectedAPI) {
          selectedAPI.should.be.an.Object;
          selectedAPI.id.should.be.equal(1);

          done();
        })
        .catch(function (err) {
          done(err);
        });
    });

    it('should return selected API Version', function (done) {
      var strategy = setupStrategyFactory.get(batchParameters);

      strategy.getAPIVersion(apis[0])
        .then(function (selectedAPIVersion) {
          selectedAPIVersion.should.be.an.Object;
          selectedAPIVersion.id.should.be.equal(1);

          done();
        })
        .catch(function (err) {
          done(err);
        });
    });

    it('should fail when selecting inexistent business group', function (done) {
      var strategy = setupStrategyFactory.get({
        bizGroup: 123,
        api: 123,
        apiVersion: 123
      });

      messagesStub.notFound = sinon.stub().returns('not found');
      messagesStub.businessGroupDescription = sinon.stub().returns('business group');

      strategy.getBusinessGroup(businessGroups)
        .then(function () {
          done('should have failed');
        })
        .catch(function () {
          messagesStub.notFound.called.should.be.ok;
          messagesStub.businessGroupDescription.called.should.be.ok;

          done();
        })
        .catch(function (err) {
          done(err);
        });
    });

    it('should fail when selecting inexistent API', function (done) {
      var strategy = setupStrategyFactory.get({
        bizGroup: 1,
        api: 123,
        apiVersion: 123
      });

      messagesStub.notFound = sinon.stub().returns('not found');
      messagesStub.apiDescription = sinon.stub().returns('api description');

      strategy.getAPI(apis)
        .then(function () {
          done('should have failed');
        })
        .catch(function () {
          messagesStub.notFound.called.should.be.ok;
          messagesStub.apiDescription.called.should.be.ok;

          done();
        })
        .catch(function (err) {
          done(err);
        });
    });

    it('should fail when selecting inexistent API Version', function (done) {
      var strategy = setupStrategyFactory.get({
        bizGroup: 1,
        api: 1,
        apiVersion: 123
      });

      messagesStub.notFound = sinon.stub().returns('not found');
      messagesStub.apiVersionDescription = sinon.stub().returns('api version description');

      strategy.getAPIVersion(apis[0])
        .then(function () {
          done('should have failed');
        })
        .catch(function () {
          messagesStub.notFound.called.should.be.ok;
          messagesStub.apiVersionDescription.called.should.be.ok;

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
    container.register('commandPrompt', commandPromptStub);
    container.register('messages', messagesStub);
    container.resolve(callback);
  };
}
