'use strict';

var BPromise = require('bluebird');

require('should');
var sinon = require('sinon');
var _ = require('lodash');

var asserts = require('../support/asserts');
var containerFactory  = require('../support/testContainerFactory');

var authenticationServiceStub = {};
var authenticationRepositoryStub = {};
var commandPromptStub = {};
var contextFactoryStub = {};
var contextHolderStub = {};
var errorsStub = {};
var loggerStub = {};
var loginPromptStub = {};
var messagesStub = {};
var processStub = {};

var cwd = 'pepe';
var commandStub = {};
var args = {arg: 1};
var newAccessToken = 2;
var loginAuthentication = {accessToken: newAccessToken};
var newAuthentication = {dir: cwd, accessToken: newAccessToken};
var authentication = {dir: 'dir', accessToken: 1};
var userContext = {context: 1};
var user = {name: 'pepe', password: 1234};
var expiredToken = 'expired token';

describe('commandRunner', function () {
  beforeEach(function () {
    commandStub.doesntNeedAuthentication = undefined;
    commandStub.parseArgs = sinon.stub().returns(args);
    commandStub.validateSetup = sinon.stub().returns(BPromise.resolve());
    commandStub.validateInput = sinon.stub().returns(BPromise.resolve());
    commandStub.execute = sinon.stub().returns(BPromise.resolve());

    authenticationRepositoryStub.get =
      sinon.stub().returns(BPromise.resolve(_.cloneDeep(authentication)));

    loggerStub.debug = sinon.stub();
    loggerStub.info = sinon.stub();

    authenticationRepositoryStub.update =
      sinon.stub().returns(BPromise.resolve(_.cloneDeep(newAuthentication)));

    loginPromptStub.getUserCredentials =
      sinon.stub().returns(BPromise.resolve(_.cloneDeep(user)));

    authenticationServiceStub.login =
      sinon.stub().returns(BPromise.resolve(_.cloneDeep(loginAuthentication)));

    contextFactoryStub.create =
      sinon.stub().returns(_.cloneDeep(userContext));

    contextHolderStub.set = sinon.stub().returns(BPromise.resolve());
    commandPromptStub.getConfirmation = sinon.stub().returns(BPromise.resolve());
    errorsStub.BadCredentialsError = sinon.stub().returns(BPromise.resolve());
    messagesStub.storeAuthenticationPromptMessage =
      sinon.stub().returns(BPromise.resolve());

    processStub.cwd = sinon.stub().returns(cwd);
  });

  describe('command doesn\'t need authentication', run(function (commandRunner) {
    beforeEach(function () {
      commandStub.doesntNeedAuthentication = true;
    });

    it('validates, runs command', function (done) {
      commandRunner.run(commandStub, args)
        .then(function () {
          validate();

          asserts.notCalled([
            authenticationRepositoryStub.get,
            authenticationRepositoryStub.update,
            loginPromptStub.getUserCredentials,
            authenticationServiceStub.login,
            commandPromptStub.getConfirmation
          ]);

          runCommand(undefined);

          done();
        })
        .catch(function (err) {
          done(err);
        });
    });
  }));

  describe('command needs authentication', run(function (commandRunner) {
    describe('user is authenticated', function () {
      it('validates, authenticates, runs command', function (done) {
        commandRunner.run(commandStub, args)
          .then(function () {
            validate();

            authenticationRepositoryStub.get.calledOnce.should.be.true();
            runCommand(authentication);

            done();
          })
          .catch(function (err) {
            done(err);
          });
      });
    });

    describe('user isn\'t authenticated', run(function (commandRunner) {
      beforeEach(function () {
        authenticationRepositoryStub
          .get = sinon.stub().returns(BPromise.resolve({dir: cwd}));
      });

      it('users wants to save his authentication', function (done) {
        commandPromptStub
          .getConfirmation = sinon.stub().returns(BPromise.resolve(true));
        commandRunner.run(commandStub, args)
          .then(function () {
            validate();
            login();

            authenticationRepositoryStub.get.calledTwice.should.be.true();
            authenticationRepositoryStub.get.secondCall.args.length
              .should.equal(0);

            asserts.calledOnceWithExactly(authenticationRepositoryStub.update,
              [newAuthentication]);
            runCommand(newAuthentication);

            done();
          })
          .catch(function (err) {
            done(err);
          });
      });

      it('the user doesn\'t want to store the authentication', function (done) {
        commandPromptStub
          .getConfirmation = sinon.stub().returns(BPromise.resolve(false));
        commandRunner.run(commandStub, args)
          .then(function () {
            validate();
            login();

            asserts.calledOnceWithoutParameters([
              authenticationRepositoryStub.get
            ]);
            asserts.notCalled([
              authenticationRepositoryStub.update
            ]);

            runCommand(loginAuthentication);

            done();
          })
          .catch(function (err) {
            done(err);
          });
      });

      function login() {
        asserts.calledOnceWithoutParameters([
          loginPromptStub.getUserCredentials,
          messagesStub.storeAuthenticationPromptMessage]);
        asserts.calledOnceWithExactly(
          authenticationServiceStub.login, [user.name, user.password]);
      }
    }));
  }));

  describe('authentication fails', run(function (commandRunner) {
    describe('with a badCredentialsError', function () {
      beforeEach(function () {
        commandPromptStub
          .getConfirmation = sinon.stub().returns(BPromise.resolve(false));
        authenticationRepositoryStub.get.onFirstCall()
          .returns(BPromise.resolve(_.cloneDeep(authentication)));
        authenticationRepositoryStub.get.onSecondCall()
          .returns(BPromise.resolve(_.cloneDeep(authentication)));
        authenticationRepositoryStub.get.onThirdCall()
          .returns(BPromise.resolve({dir: cwd}));

        errorsStub.BadCredentialsError = String;
        /* jshint ignore:start */
        commandStub.execute = sinon.stub();
        commandStub.execute
          .onFirstCall().returns(BPromise.reject(new String('pepe')))
          .onSecondCall().returns(BPromise.resolve())
        /* jshint ignore:end */

        messagesStub.expiredTokenMessage = sinon.stub().returns(expiredToken);
      });

      it('deletes authentication and tries all again', function (done) {
        commandRunner.run(commandStub, args)
          .then(function () {
            commandStub.validateSetup.calledTwice.should.be.true();
            commandStub.validateSetup
              .alwaysCalledWithExactly().should.be.true();

            commandStub.validateInput.calledTwice.should.be.true();
            commandStub.validateInput
              .alwaysCalledWithExactly(args).should.be.true();

            contextFactoryStub.create.calledTwice.should.be.true();
            contextFactoryStub.create.firstCall
              .calledWithExactly(authentication, cwd).should.be.true();
            contextFactoryStub.create.secondCall
              .calledWithExactly(loginAuthentication, cwd).should.be.true();

            contextHolderStub.set.calledTwice.should.be.true();
            contextHolderStub.set.alwaysCalledWithExactly(userContext)
              .should.be.true();

            commandStub.execute.calledTwice.should.be.true();
            commandStub.execute.alwaysCalledWithExactly(args).should.be.true();

            authenticationRepositoryStub.get.calledThrice.should.be.true();

            asserts.calledOnceWithExactly(authenticationRepositoryStub.update, [
              {dir: 'dir'}
            ]);
            commandStub.validateSetup.calledTwice.should.be.true();

            asserts.calledOnceWithoutParameters([
              messagesStub.expiredTokenMessage
            ]);

            asserts.calledOnceWithExactly(loggerStub.debug, [
              'Bad credentials'
            ]);

            asserts.calledOnceWithExactly(loggerStub.info, [
              expiredToken
            ]);

            done();
          })
          .catch(function (err) {
            done(err);
          });
      });
    });

    describe('with an unexpected error', function () {
      var error;
      var errorMessage = 'pepe';
      /* jshint ignore:start */
      error = new String(errorMessage);
      /* jshint ignore:end */
      beforeEach(function () {
        errorsStub.BadCredentialsError = Boolean;
        commandStub.execute = sinon.stub().returns(BPromise.reject(error));
      });

      it('rejects with the error', function (done) {
        commandRunner.run(commandStub, args)
          .then(function () {
            done('should fail');
          })
          .catch(function (err) {
            validate();
            authenticationRepositoryStub.get.calledOnce.should.be.true();
            runCommand(authentication);

            err.should.equal(errorMessage);

            done();
          })
          .catch(function (err) {
            done(err);
          });
      });
    });
  }));

  function validate() {
    asserts.calledOnceWithoutParameters([commandStub.validateSetup]);
    asserts.calledOnceWithExactly(commandStub.validateInput, [args]);
  }

  function runCommand(authentication) {
    asserts.calledOnceWithExactly(contextFactoryStub.create,
      [authentication, cwd]);
    asserts.calledOnceWithExactly(contextHolderStub.set, [userContext]);
    asserts.calledOnceWithExactly(commandStub.execute, [args]);
  }
});

function run(callback) {
  return function () {
    var container = containerFactory.createContainer();
    container.register('authenticationService', authenticationServiceStub);
    container.register('authenticationRepository',
      authenticationRepositoryStub);
    container.register('commandPrompt', commandPromptStub);
    container.register('contextFactory', contextFactoryStub);
    container.register('contextHolder', contextHolderStub);
    container.register('errors', errorsStub);
    container.register('logger', loggerStub);
    container.register('loginPrompt', loginPromptStub);
    container.register('messages', messagesStub);
    container.register('process', processStub);
    container.resolve(callback);
  };
}
