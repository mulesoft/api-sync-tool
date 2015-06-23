'use strict';

require('should');
var sinon = require('sinon');

var asserts = require('../support/asserts');
var containerFactory  = require('../support/testContainerFactory');

var authenticationServiceStub = {};
var authenticationRepositoryStub = {};
var commandPromptStub = {};
var contextFactoryStub = {};
var contextHolderStub = {};
var errorsStub = {};
var loginPromptStub = {};
var messagesStub = {};

var commandStub = {};
var args = {arg: 1};
var authentication = {dir: 'dir', accessToken: 1};
var userContext = {context: 1};
var user = {name: 'pepe', password: 1234};

describe('commandRunner', function () {
  beforeEach(function () {
    commandStub.validateSetup = sinon.stub().returns(Promise.resolve());
    commandStub.validateInput = sinon.stub().returns(Promise.resolve());
    commandStub.execute = sinon.stub().returns(Promise.resolve());

    authenticationRepositoryStub
      .get = sinon.stub().returns(Promise.resolve(authentication));
    authenticationRepositoryStub
      .update = sinon.stub().returns(Promise.resolve());

    loginPromptStub
      .getUserCredentials = sinon.stub().returns(Promise.resolve(user));

    authenticationServiceStub.login =
      sinon.stub().returns(Promise.resolve(authentication));

    authenticationServiceStub.login =
      sinon.stub().returns(Promise.resolve(authentication));

    contextFactoryStub.create =
      sinon.stub().returns(Promise.resolve(userContext));

    contextHolderStub.set = sinon.stub().returns(Promise.resolve());
    commandPromptStub.getConfirmation = sinon.stub().returns(Promise.resolve());
    errorsStub.BadCredentialsError = sinon.stub().returns(Promise.resolve());
    messagesStub.storeAuthenticationPromptMessage =
      sinon.stub().returns(Promise.resolve());
  });

  describe('command runs successfully', run(function (commandRunner) {
    it('validates', function (done) {
      commandRunner.run(commandStub, args)
        .then(function () {
          asserts.calledOnceWithoutParameters([commandStub.validateSetup]);
          asserts.calledOnceWithExactly(commandStub.validateInput, [args]);

          done();
        })
        .catch(function (err) {
          done(err);
        });
    });

    it('gets stored authentication', function (done) {
      commandRunner.run(commandStub, args)
        .then(function () {
          authenticationRepositoryStub.get.calledOnce.should.be.true;
          asserts.calledOnceWithExactly(
            contextFactoryStub.create, [authentication, process.cwd]);
          asserts.calledOnceWithExactly(contextHolderStub.set, [userContext]);

          done();
        })
        .catch(function (err) {
          done(err);
        });
    });

    it('runs command', function (done) {
      commandRunner.run(commandStub, args)
        .then(function () {
          asserts.calledOnceWithExactly(commandStub.execute, [args]);

          done();
        })
        .catch(function (err) {
          done(err);
        });
    });
  }));

  describe('user isn\'t authenticated', run(function (commandRunner) {
    beforeEach(function () {
      authenticationRepositoryStub
        .get = sinon.stub().returns(Promise.resolve({}));
    });

    it('logs the user', function (done) {
      commandRunner.run(commandStub, args)
        .then(function () {
          asserts.calledOnceWithoutParameters(
            [loginPromptStub.getUserCredentials,
            messagesStub.storeAuthenticationPromptMessage]);
          asserts.calledOnceWithExactly(
            authenticationServiceStub.login, [user.name, user.password]);

          done();
        })
        .catch(function (err) {
          done(err);
        });
    });

    it('the user wants to store the authentication', function (done) {
      commandPromptStub
        .getConfirmation = sinon.stub().returns(Promise.resolve(true));
      commandRunner.run(commandStub, args)
        .then(function () {
          authenticationRepositoryStub.get.calledTwice.should.be.true;
          authenticationRepositoryStub.get.secondCall.args.length === 0;
          asserts.calledOnceWithExactly(authenticationRepositoryStub.update,
            [authentication]);

          done();
        })
        .catch(function (err) {
          done(err);
        });
    });

    it('the user doesn\'t want to store the authentication', function (done) {
      commandPromptStub
        .getConfirmation = sinon.stub().returns(Promise.resolve(false));
      commandRunner.run(commandStub, args)
        .then(function () {
          authenticationRepositoryStub.get.calledOnce.should.be.true;

          done();
        })
        .catch(function (err) {
          done(err);
        });
    });
  }));

  describe('authentication fails', run(function (commandRunner) {
    describe('with a badCredentialsError', function () {
      beforeEach(function () {
        errorsStub.BadCredentialsError = String;
        /* jshint ignore:start */
        commandStub.execute = sinon.stub();
        commandStub.execute
          .onFirstCall().returns(Promise.reject(new String('pepe')))
          .onSecondCall().returns(Promise.resolve())
        /* jshint ignore:end */
      });

      it('deletes authentication and tries all again', function (done) {
        commandRunner.run(commandStub, args)
          .then(function () {
            asserts.calledOnceWithExactly(authenticationRepositoryStub.update,
              [{dir: 'dir'}]);
            commandStub.validateSetup.calledTwice.should.be.true;
            commandStub.execute.calledTwice.should.be.true;

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
        commandStub.execute = sinon.stub().returns(Promise.reject(error));
      });

      it('rejects with the error', function (done) {
        commandRunner.run(commandStub, args)
          .then(function () {
            done('should fail');
          })
          .catch(function (err) {
            err.should.equal(errorMessage);

            done();
          });
      });
    });
  }));
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
    container.register('loginPrompt', loginPromptStub);
    container.register('messages', messagesStub);
    container.resolve(callback);
  };
}
