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
          messagesStub.commandUsage.firstCall.args[2].should.containEql('i');

          message.should.be.an.String;
          message.should.equal(successfulMessage);

          done();
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
      setupCommand.validateInput({subOrg: '1234', apiId: '1234', apiVersionId: '1234'})
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
        });
    });

    it('should run the command in batch mode', function (done) {
      setupCommand.execute({subOrg: 1234, apiId: 1234, apiVersionId: 1234})
        .then(function () {
          setupControllerStub.setup.called.should.be.true;
          setupStrategyFactoryStub.get.called.should.be.true;
          messagesStub.setupSuccessful.called.should.be.true;
          loggerStub.info.called.should.be.true;
          loggerStub.info.firstCall.args[0].should.equal('Ok');

          done();
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
