'use strict';

var should = require('should');
var sinon = require('sinon');

var asserts = require('../support/asserts');
var containerFactory  = require('../support/testContainerFactory');

var inquirerStub = {};
var loggerStub = {};
var messagesStub = {};

var loginMessage = 'message';
var userCredentials = {
  name: 'Pepe',
  password: 'pepe1234'
};

describe('loginPrompt', function () {
  beforeEach(function () {
    inquirerStub.prompt = sinon.stub();
    loggerStub.info = sinon.stub();
    messagesStub.loginPromptMessage = sinon.stub().returns(loginMessage);
  });

  describe('getUserCredentials', run(function (loginPrompt) {
    it('should prompt for a choice', function (done) {
      inquirerStub.prompt.callsArgWith(1, userCredentials);

      loginPrompt.getUserCredentials()
        .then(function (result) {
          asserts.calledOnceWithExactly(inquirerStub.prompt, [[
            {
              type: 'input',
              name: 'name',
              message: 'Username: '
            },
            {
              type: 'password',
              name: 'password',
              message: 'Password: '
            }],
            sinon.match.func
          ]);

          asserts.calledOnceWithoutParameters([
            messagesStub.loginPromptMessage]);
          asserts.calledOnceWithExactly(loggerStub.info, [loginMessage]);

          result.should.be.an.Object();
          should.deepEqual(result, userCredentials);

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
    container.register('inquirer', inquirerStub);
    container.register('logger', loggerStub);
    container.register('messages', messagesStub);
    container.resolve(callback);
  };
}
