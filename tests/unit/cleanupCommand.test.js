'use strict';

var BPromise = require('bluebird');

require('should');
var sinon = require('sinon');

var containerFactory  = require('../support/testContainerFactory');
var asserts  = require('../support/asserts');

var cleanupControllerStub = {};
var loggerStub = {};
var messagesStub = {};

var successfulMessage = 'Success';

describe('cleanupCommand', function () {
  beforeEach(function () {
    cleanupControllerStub.cleanup = sinon.stub().returns(BPromise.resolve());
    messagesStub.cleanup = sinon.stub().returns(successfulMessage);
    messagesStub.cleanupDetailedHelp = sinon.stub();
    loggerStub.info = sinon.stub();
  });

  describe('doesntNeedAuthentication', function () {
    it('should be true', function (done) {
      run(function (cleanupCommand) {
        cleanupCommand.doesntNeedAuthentication.should.be.true();
        done();
      });
    });
  });

  describe('getHelp', function () {
    it('should be a message', function (done) {
      run(function (cleanupCommand) {
        messagesStub.cleanupDetailedHelp.should.equal(cleanupCommand.getHelp);
        done();
      });
    });
  });

  describe('validateSetup', function () {
    it('should run validation and do nothing', function (done) {
      run(function (cleanupCommand) {
        cleanupCommand.validateSetup()
          .then(function () {
            done();
          })
          .catch(function (err) {
            done(err);
          });
      });
    });
  });

  describe('validateInput', function () {
    it('should run validation and do nothing', function (done) {
      run(function (cleanupCommand) {
        cleanupCommand.validateInput()
          .then(function () {
            done();
          })
          .catch(function (err) {
            done(err);
          });
      });
    });
  });

  describe('parseArgs', function () {
    it('should parse args and do nothing', function (done) {
      run(function (cleanupCommand) {
        cleanupCommand.parseArgs()
          .then(function () {
            done();
          })
          .catch(function (err) {
            done(err);
          });
      });
    });
  });

  describe('execute', function () {
    it('should execute cleanup and log a successful result', function (done) {
      run(function (cleanupCommand) {
        cleanupCommand.execute()
          .then(function () {
            asserts.calledOnceWithoutParameters([cleanupControllerStub.cleanup,
              messagesStub.cleanup]);

            asserts.calledOnceWithExactly(loggerStub.info, [successfulMessage]);

            done();
          })
          .catch(function (err) {
            done(err);
          });
      });
    });
  });
});

function run(callback) {
  var container = containerFactory.createContainer();
  container.register('messages', messagesStub);
  container.register('logger', loggerStub);
  container.register('cleanupController', cleanupControllerStub);
  container.resolve(callback);
}
