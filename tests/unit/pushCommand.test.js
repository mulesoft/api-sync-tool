'use strict';

require('should');
var sinon = require('sinon');

var containerFactory  = require('../support/testContainerFactory');

var loggerStub = {};
var messagesStub = {};
var pushControllerStub = {};
var validateSetupStrategyStub = {};

var successfulMessage = 'Success';
var nothingMessage = 'Nothing';

var pushControllerResult = {
  added: ['api.raml'],
  changed: ['temp.json'],
  deleted: ['temp1.json']
};

var pushControllerEmptyResult = {
  added: [],
  changed: [],
  deleted: []
};

describe('pushCommand', function () {
  beforeEach(function () {
    messagesStub.status = sinon.stub().returns(successfulMessage);
    messagesStub.nothingPush = sinon.stub().returns(nothingMessage);
    pushControllerStub.push = sinon.stub();
    loggerStub.info = sinon.stub();
    validateSetupStrategyStub.validate = sinon.stub();
  });

  describe('validateSetup', run(function (pushCommand) {
    it('should be a dependency', function (done) {
      validateSetupStrategyStub.should.equal(pushCommand.validateSetup);

      done();
    });
  }));

  describe('execute', run(function (pushCommand) {
    it('should run validation and do nothing', function (done) {
      pushCommand.validateInput()
        .then(function () {
          done();
        })
        .catch(function (err) {
          done(err);
        });
    });
  }));

  describe('execute', run(function (pushCommand) {
    it('should execute push and log a successful result', function (done) {
      pushControllerStub.push.returns(Promise.resolve(pushControllerResult));

      pushCommand.execute()
        .then(function () {
          pushControllerStub.push.calledOnce.should.be.true;
          pushControllerStub.push.firstCall.args.length.should.equal(0);

          messagesStub.status.calledOnce.should.be.true;
          messagesStub.status.calledWith(pushControllerResult)
            .should.be.true;

          loggerStub.info.calledOnce.should.be.true;
          loggerStub.info.calledWith(successfulMessage).should.be.true;

          done();
        })
        .catch(function (err) {
          done(err);
        });
    });

    it('should execute push command and log a nothing result', function (done) {
      pushControllerStub.push.returns(Promise.resolve(pushControllerEmptyResult));

      pushCommand.execute()
        .then(function () {
          pushControllerStub.push.calledOnce.should.be.true;
          pushControllerStub.push.firstCall.args.length.should.equal(0);

          messagesStub.nothingPush.calledOnce.should.be.true;
          messagesStub.nothingPush.firstCall.args.length.should.equal(0);

          loggerStub.info.calledOnce.should.be.true;
          loggerStub.info.calledWithExactly(nothingMessage).should.be.true;

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
    container.register('pushController', pushControllerStub);
    container.register('validateSetupStrategy', validateSetupStrategyStub);
    container.resolve(callback);
  };
}
