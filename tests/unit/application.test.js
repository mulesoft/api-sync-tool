'use strict';

var BPromise = require('bluebird');

require('should');
var sinon = require('sinon');

var asserts = require('../support/asserts');
var containerFactory  = require('../support/testContainerFactory');
var BaseError = function () {
  this.x = 1;
};
var BaseErrorStub = function () {
  return BaseError;
};
var commandFactoryStub = {};
var commandRunnerStub = {};
var commandsStub = {};
var commandStub = {};
var loggerStub = {};
var messagesStub = {};
var omeletteReturnsStub = {};
var omeletteStub = {};
var processStub = {};

var helpMessage = 'help';
var errorMessage = 'error';
var unexpectedError = 'unexpectedError';

describe('application', function () {
  beforeEach(function () {
    commandStub = sinon.stub();
    commandStub.getHelp = sinon.stub().returns(helpMessage);
    commandFactoryStub.get = sinon.stub().returns(BPromise.resolve(commandStub));

    commandRunnerStub.run = sinon.stub();

    commandsStub = sinon.stub();

    loggerStub.error = sinon.stub();
    loggerStub.debug = sinon.stub();
    loggerStub.info = sinon.stub();
    loggerStub.onComplete = sinon.stub();
    loggerStub.onComplete.onFirstCall().callsArg(1);

    messagesStub.unexpectedError = sinon.stub().returns(unexpectedError);

    omeletteReturnsStub.on = sinon.stub();
    omeletteReturnsStub.on.onFirstCall().callsArgOn(1, omeletteReturnsStub);
    omeletteReturnsStub.init = sinon.stub();
    omeletteReturnsStub.reply = sinon.stub();

    omeletteStub = sinon.stub().returns(omeletteReturnsStub);

    processStub.exit = sinon.stub();
  });

  describe('run', function () {
    it('should run the command', function (done) {
      var args = {_: ['test']};
      run(function (application) {
        application.run(args)
          .then(function () {
            assertSetup(args);
            asserts.calledOnceWithExactly(commandRunnerStub.run, [
              commandStub,
              args
            ]);

            asserts.notCalled([loggerStub.info]);

            done();
          })
          .catch(function (err) {
            done(err);
          });
      });
    });

    it('should print help message when asked', function (done) {
      var args = {_: ['test'], help: true};
      run(function (application) {
        application.run(args)
          .then(function () {
            assertSetup(args);

            asserts.calledOnceWithExactly(loggerStub.info, [
              helpMessage
            ]);

            asserts.calledOnceWithoutParameters([
              commandStub.getHelp
            ]);

            asserts.notCalled([commandRunnerStub.run]);

            done();
          })
          .catch(function (err) {
            done(err);
          });
      });
    });

    it('should catch errors from commandFactory', function (done) {
      commandFactoryStub.get =
        sinon.stub().returns(BPromise.reject(errorMessage));

      var args = {_: ['test']};
      run(function (application) {
        application.run(args)
          .then(function () {
            done('should fail');
          })
          .catch(function (err) {
            assertSetup(args);
            err.should.equal(errorMessage);

            asserts.notCalled([
              loggerStub.info
            ]);

            assertsErrors();
            asserts.calledOnceWithExactly(loggerStub.debug, [
              errorMessage
            ]);

            done();
          })
          .catch(function (err) {
            done(err);
          });
      });
    });

    it('should catch errors from commandRunner', function (done) {
      commandRunnerStub.run =
        sinon.stub().returns(BPromise.reject(errorMessage));

      var args = {_: ['test']};
      run(function (application) {
        application.run(args)
          .then(function () {
            done('should fail');
          })
          .catch(function (err) {
            assertSetup(args);
            err.should.equal(errorMessage);

            asserts.calledOnceWithExactly(commandRunnerStub.run, [
              commandStub,
              args
            ]);

            asserts.notCalled([
              loggerStub.info
            ]);

            assertsErrors();
            loggerStub.debug.secondCall
              .calledWithExactly(errorMessage).should.be.true();

            done();
          })
          .catch(function (err) {
            done(err);
          });
      });
    });

    it('should catch expected errors', function (done) {
      var error = new BaseError();

      commandRunnerStub.run =
        sinon.stub().returns(BPromise.reject(error));

      var args = {_: ['test']};
      run(function (application) {
        application.run(args)
          .then(function () {
            done('should fail');
          })
          .catch(function (err) {
            assertSetup(args);
            err.should.equal(error);

            asserts.calledOnceWithExactly(commandRunnerStub.run, [
              commandStub,
              args
            ]);

            asserts.notCalled([
              loggerStub.info
            ]);

            asserts.calledOnceWithExactly(loggerStub.error, [err]);
            asserts.calledOnceWithExactly(loggerStub.onComplete, [
              err,
              sinon.match.func
            ]);
            asserts.calledOnceWithExactly(processStub.exit, [1]);

            done();
          })
          .catch(function (err) {
            done(err);
          });
      });
    });
  });
});

function assertSetup(args) {
  asserts.calledOnceWithExactly(omeletteStub, ['api-sync <command>']);
  asserts.calledOnceWithoutParameters([omeletteReturnsStub.init]);
  asserts.calledOnceWithExactly(omeletteReturnsStub.on, [
    'command',
    sinon.match.func
  ]);
  asserts.calledOnceWithExactly(omeletteReturnsStub.reply, [commandsStub]);

  asserts.calledOnceWithExactly(commandFactoryStub.get, [
    args
  ]);
}

function assertsErrors() {
  asserts.calledOnceWithExactly(loggerStub.error, [unexpectedError]);
  asserts.calledOnceWithExactly(loggerStub.onComplete, [
    errorMessage,
    sinon.match.func
  ]);
  asserts.calledOnceWithExactly(processStub.exit, [1]);
}

function run(callback) {
  var container = containerFactory.createContainer();
  container.register('BaseError', BaseErrorStub);
  container.register('commandFactory', commandFactoryStub);
  container.register('commandRunner', commandRunnerStub);
  container.register('commands', function () {
    return commandsStub;
  });
  container.register('logger', loggerStub);
  container.register('messages', messagesStub);
  container.register('omelette', function () {
    return omeletteStub;
  });
  container.register('process', processStub);
  container.resolve(callback);
}
