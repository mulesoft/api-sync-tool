'use strict';

var BPromise = require('bluebird');

var should = require('should');
var sinon = require('sinon');

var asserts = require('../support/asserts');
var containerFactory = require('../support/testContainerFactory');
var contentGenerator = require('../support/contentGenerator');

var commandPromptStub = {};
var messagesStub = {};
var errorsStub = {};

var businessGroups = contentGenerator.generateBusinessGroups();
var apis = contentGenerator.generateApis();
var batchParameters = {
  bizGroup: 1,
  api: 1,
  apiVersion: 1
};

var businessGroupPromptMessage = 'Select bizGroup';
var apiPromptMessage = 'Select API';
var apiVersionPromptMessage = 'Select API Version';
var runPullPromptMessage = 'Should run pull?';

describe('setupStrategyFactory', function () {
  beforeEach(function () {
    messagesStub.businessGroupPromptMessage =
      sinon.stub().returns(businessGroupPromptMessage);
    messagesStub.apiPromptMessage =
      sinon.stub().returns(apiPromptMessage);
    messagesStub.apiVersionPromptMessage =
      sinon.stub().returns(apiVersionPromptMessage);
    messagesStub.runPullPromptMessage =
      sinon.stub().returns(runPullPromptMessage);

    commandPromptStub.getChoice = sinon.stub()
      .withArgs(sinon.match.any, 'name', 'id', sinon.match.any);

    commandPromptStub.getConfirmation = sinon.stub();
  });

  describe('interactive', run(function (setupStrategyFactory) {
    it('should return selected business group', function (done) {
      // Setup return value for stub method.
      commandPromptStub.getChoice.returns(BPromise.resolve(businessGroups[0]));

      var strategy = setupStrategyFactory.get({isInteractive: true});

      strategy.getBusinessGroup(businessGroups)
        .then(function (selectedBusinessGroup) {
          selectedBusinessGroup.should.be.an.Object();
          selectedBusinessGroup.id.should.be.equal(1);

          asserts.calledOnceWithExactly(commandPromptStub.getChoice, [
            businessGroupPromptMessage,
            'name', 'id', businessGroups
          ]);
          asserts.calledOnceWithoutParameters([
            messagesStub.businessGroupPromptMessage]);

          done();
        })
        .catch(function (err) {
          done(err);
        });
    });

    it('should return selected api', function (done) {
      // Setup return value for stub method.
      commandPromptStub.getChoice.returns(BPromise.resolve(apis[0]));

      var strategy = setupStrategyFactory.get({isInteractive: true});

      strategy.getAPI(apis)
        .then(function (selectedAPI) {
          selectedAPI.should.be.an.Object();
          selectedAPI.id.should.be.equal(1);

          asserts.calledOnceWithExactly(commandPromptStub.getChoice, [
            apiPromptMessage,
            'name', 'id', apis
          ]);
          asserts.calledOnceWithoutParameters([messagesStub.apiPromptMessage]);

          done();
        })
        .catch(function (err) {
          done(err);
        });
    });

    it('should return selected api version', function (done) {
      // Setup return value for stub method.
      commandPromptStub.getChoice.returns(BPromise.resolve(apis[0].versions[0]));

      var strategy = setupStrategyFactory.get({isInteractive: true});

      strategy.getAPIVersion(apis[0].versions)
        .then(function (selectedAPIVersion) {
          selectedAPIVersion.should.be.an.Object();
          selectedAPIVersion.id.should.be.equal(1);

          asserts.calledOnceWithExactly(commandPromptStub.getChoice, [
            apiVersionPromptMessage,
            'name', 'id', apis[0].versions
          ]);
          asserts.calledOnceWithoutParameters([
            messagesStub.apiVersionPromptMessage]);

          done();
        })
        .catch(function (err) {
          done(err);
        });
    });

    it('should return run pull decision', function (done) {
      // Setup return value for stub method.
      commandPromptStub.getConfirmation.returns(BPromise.resolve(true));

      var strategy = setupStrategyFactory.get({isInteractive: true});

      strategy.getRunPull()
        .then(function (getRunPull) {
          getRunPull.should.be.ok();
          asserts.calledOnceWithExactly(commandPromptStub.getConfirmation, [
            runPullPromptMessage]);
          asserts.calledOnceWithoutParameters([
            messagesStub.runPullPromptMessage]);

          done();
        })
        .catch(function (err) {
          done(err);
        });
    });
  }));

  describe('batch', run(function (setupStrategyFactory) {
    var error = {error: 'error'};
    beforeEach(function () {
      errorsStub.ChoiceNotFoundError = sinon.stub().returns(error);
    });

    it('should return selected business group', function (done) {
      var strategy = setupStrategyFactory.get(batchParameters);

      strategy.getBusinessGroup(businessGroups)
        .then(function (selectedBusinessGroup) {
          selectedBusinessGroup.should.be.an.Object();
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
          selectedAPI.should.be.an.Object();
          selectedAPI.id.should.be.equal(1);

          done();
        })
        .catch(function (err) {
          done(err);
        });
    });

    it('should return selected API Version', function (done) {
      var strategy = setupStrategyFactory.get(batchParameters);

      strategy.getAPIVersion(apis[0].versions)
        .then(function (selectedAPIVersion) {
          selectedAPIVersion.should.be.an.Object();
          selectedAPIVersion.id.should.be.equal(1);

          done();
        })
        .catch(function (err) {
          done(err);
        });
    });

    it('should return run pull decision', function (done) {
      batchParameters.runPull = true;
      var strategy = setupStrategyFactory.get(batchParameters);

      strategy.getRunPull()
        .then(function (getRunPull) {
          getRunPull.should.be.ok();

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

      messagesStub.businessGroupDescription =
        sinon.stub().returns('business group');

      strategy.getBusinessGroup(businessGroups)
        .then(function () {
          done('should have failed');
        })
        .catch(function (err) {
          errorsStub.ChoiceNotFoundError.called.should.be.true();
          errorsStub.ChoiceNotFoundError.firstCall
            .args.length.should.equal(1);
          errorsStub.ChoiceNotFoundError.firstCall
            .args[0].should.equal(messagesStub.businessGroupDescription());

          err.should.be.an.Object();
          should.deepEqual(err, error);

          messagesStub.businessGroupDescription.called.should.be.ok();

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

      messagesStub.apiDescription = sinon.stub().returns('api description');

      strategy.getAPI(apis)
        .then(function () {
          done('should have failed');
        })
        .catch(function (err) {
          errorsStub.ChoiceNotFoundError.called.should.be.true();
          errorsStub.ChoiceNotFoundError.firstCall
            .args.length.should.equal(1);
          errorsStub.ChoiceNotFoundError.firstCall
            .args[0].should.equal(messagesStub.apiDescription());

          err.should.be.an.Object();
          should.deepEqual(err, error);

          messagesStub.apiDescription.called.should.be.ok();

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

      messagesStub.apiVersionDescription =
        sinon.stub().returns('api version description');

      strategy.getAPIVersion(apis[0])
        .then(function () {
          done('should have failed');
        })
        .catch(function (err) {
          errorsStub.ChoiceNotFoundError.called.should.be.true();
          errorsStub.ChoiceNotFoundError.firstCall
            .args.length.should.equal(1);
          errorsStub.ChoiceNotFoundError.firstCall
            .args[0].should.equal(messagesStub.apiVersionDescription());

          err.should.be.an.Object();
          should.deepEqual(err, error);

          messagesStub.apiVersionDescription.called.should.be.ok();

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
    container.register('errors', errorsStub);
    container.resolve(callback);
  };
}
