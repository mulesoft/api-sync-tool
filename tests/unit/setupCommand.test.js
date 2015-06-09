'use strict';

var should = require('should');
var sinon = require('sinon');

var containerFactory  = require('../support/testContainerFactory');
var contentGenerator = require('../support/contentGenerator');

var messagesStub = {};
var loggerStub = {};
var setupControllerStub = {};
var setupStrategyFactoryStub = {};

var workspace = contentGenerator.generateWorkspace();
var successfulMessage = 'Success message';

describe('setupCommand', function () {
  beforeEach(function () {
    messagesStub.interactiveDescription = sinon.stub().returns('interactive');
    messagesStub.businessGroupDescription = sinon.stub().returns('bizGroup');
    messagesStub.apiDescription = sinon.stub().returns('api');
    messagesStub.apiVersionDescription = sinon.stub().returns('apiVersion');
    messagesStub.commandUsage = sinon.stub().returns(successfulMessage);
    messagesStub.setupSuccessful = sinon.stub().returns('Ok');
    setupControllerStub.setup = sinon.stub().returns(Promise.resolve(workspace));
    setupStrategyFactoryStub.get = sinon.stub();
    loggerStub.info = sinon.stub();
  });

  describe('validateInput', run(function (setupCommand) {
    it('should fail when no arguments are specified', function (done) {
      setupCommand.validateInput({})
        .then(function () {
          done('Error: test should fail');
        })
        .catch(function (message) {
          messagesStub.commandUsage.called.should.be.true;
          messagesStub.commandUsage.firstCall.args[0].should.equal('setup');
          should(messagesStub.commandUsage.firstCall.args[1]).not.be.ok;

          messagesStub.commandUsage.firstCall.args[2].should.be.an.Array;

          message.should.be.an.String;
          message.should.equal(successfulMessage);

          done();
        })
        .catch(function (err) {
          done(err);
        });
    });

    it('should pass when interactive argument is present', function (done) {
      setupCommand.validateInput({i: true})
        .then(function () {
          done();
        })
        .catch(function (err) {
          done(err);
        });
    });

    it('should pass when batch arguments are presenet', function (done) {
      setupCommand.validateInput({bizGroup: 1234, api: 'name', apiVersion: 'version'})
        .then(function () {
          done();
        })
        .catch(function (err) {
          done(err);
        });
    });
  }));

  describe('execute', run(function (setupCommand) {
    it('should run the command in interactive mode', function (done) {
      setupCommand.execute({i: true})
        .then(function () {
          setupControllerStub.setup.called.should.be.true;
          setupStrategyFactoryStub.get.called.should.be.true;
          messagesStub.setupSuccessful.called.should.be.true;
          loggerStub.info.called.should.be.true;
          loggerStub.info.firstCall.args[0].should.equal('Ok');

          done();
        })
        .catch(function (err) {
          done(err);
        });
    });

    it('should run the command in batch mode', function (done) {
      setupCommand.execute({bizGroup: 1234, api: 'name', apiVersion: 'version'})
        .then(function () {
          setupControllerStub.setup.called.should.be.true;
          setupStrategyFactoryStub.get.called.should.be.true;
          messagesStub.setupSuccessful.called.should.be.true;
          loggerStub.info.called.should.be.true;
          loggerStub.info.firstCall.args[0].should.equal('Ok');

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
    container.register('messages', messagesStub);
    container.register('logger', loggerStub);
    container.register('setupController', setupControllerStub);
    container.register('setupStrategyFactory', setupStrategyFactoryStub);
    container.resolve(callback);
  };
}
