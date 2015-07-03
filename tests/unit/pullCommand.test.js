'use strict';

require('should');
var sinon = require('sinon');

var containerFactory  = require('../support/testContainerFactory');
var asserts  = require('../support/asserts');

var loggerStub = {};
var messagesStub = {};
var pullControllerStub = {};
var validateSetupDoneStrategyStub = {};

var statusMessage = 'status';
var emptyMessage = 'empty';

var results = [
  {
    path: '/api.raml',
    hash: 'asd1231das'
  }
];

describe('cleanupCommand', function () {
  beforeEach(function () {
    pullControllerStub.getAPIFiles = sinon.stub();
    messagesStub.status = sinon.stub().returns(statusMessage);
    messagesStub.emptyAPIPullmessage = sinon.stub().returns(emptyMessage);
    loggerStub.info = sinon.stub();
    validateSetupDoneStrategyStub.validate = sinon.stub();
  });

  describe('validateSetup', run(function (pullCommand) {
    it('should be a dependency', function (done) {
      validateSetupDoneStrategyStub.should.equal(pullCommand.validateSetup);

      done();
    });
  }));

  describe('validateInput', run(function (pullCommand) {
    it('should run validation and do nothing', function (done) {
      pullCommand.validateInput()
        .then(function () {
          done();
        })
        .catch(function (err) {
          done(err);
        });
    });
  }));

  describe('parseArgs', run(function (pullCommand) {
    it('should parse args and do nothing', function (done) {
      pullCommand.parseArgs()
        .then(function () {
          done();
        })
        .catch(function (err) {
          done(err);
        });
    });
  }));

  describe('execute', run(function (pullCommand) {
    it('should execute pull and log the added files', function (done) {
      pullControllerStub.getAPIFiles.returns(Promise.resolve(results));

      pullCommand.execute()
        .then(function () {
          asserts.calledOnceWithoutParameters([pullControllerStub.getAPIFiles]);
          asserts.calledOnceWithExactly(messagesStub.status,
            [{added: [results[0].path]}]);

          asserts.calledOnceWithExactly(loggerStub.info, [statusMessage]);

          done();
        })
        .catch(function (err) {
          done(err);
        });
    });

    it('should execute pull and log if no files where found', function (done) {
      pullControllerStub.getAPIFiles.returns(Promise.resolve([]));

      pullCommand.execute()
        .then(function () {
          asserts.calledOnceWithoutParameters([pullControllerStub.getAPIFiles,
            messagesStub.emptyAPIPullmessage]);

          asserts.calledOnceWithExactly(loggerStub.info, [emptyMessage]);

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
    container.register('pullController', pullControllerStub);
    container.register('validateSetupDoneStrategy', validateSetupDoneStrategyStub);
    container.resolve(callback);
  };
}
