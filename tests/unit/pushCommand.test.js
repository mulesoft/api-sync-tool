'use strict';

var BPromise = require('bluebird');

var should = require('should');
var sinon = require('sinon');

var containerFactory  = require('../support/testContainerFactory');

var loggerStub = {};
var messagesStub = {};
var pushControllerStub = {};
var validateSetupDoneStrategyStub = {};

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
    messagesStub.pushDetailedHelp = sinon.stub();
    pushControllerStub.forcePush = sinon.stub();
    pushControllerStub.push = sinon.stub();
    loggerStub.info = sinon.stub();
    validateSetupDoneStrategyStub.validate = sinon.stub();
  });

  describe('getHelp', function () {
    it('should be a message', function (done) {
      run(function (pushCommand) {
        messagesStub.pushDetailedHelp.should.equal(pushCommand.getHelp);
        done();
      });
    });
  });

  describe('validateSetup', function () {
    it('should be a dependency', function (done) {
      run(function (pushCommand) {
        validateSetupDoneStrategyStub.should.equal(pushCommand.validateSetup);

        done();
      });
    });
  });

  describe('validateInput', function () {
    it('should run validation and do nothing', function (done) {
      run(function (pushCommand) {
        pushCommand.validateInput()
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
    it('should parse empty args', function (done) {
      run(function (pushCommand) {
        try {
          should.deepEqual(pushCommand.parseArgs({}), {
            force: undefined
          });

          done();
        } catch (err) {
          done(err);
        }
      });
    });

    it('should parse force push args', function (done) {
      run(function (pushCommand) {
        try {
          should.deepEqual(pushCommand.parseArgs({f: true}), {
            force: true
          });

          done();
        } catch (err) {
          done(err);
        }
      });
    });
  });

  describe('execute', function () {
    it('should execute force push with the force argument', function (done) {
      pushControllerStub.forcePush
        .returns(BPromise.resolve(pushControllerResult));
      run(function (pushCommand) {
        pushCommand.execute({force: true})
          .then(function () {
            pushControllerStub.forcePush.calledOnce.should.be.true();
            pushControllerStub.forcePush.firstCall.args.length.should.equal(0);

            messagesStub.status.calledOnce.should.be.true();
            messagesStub.status.calledWith(pushControllerResult)
              .should.be.true();

            loggerStub.info.calledOnce.should.be.true();
            loggerStub.info.calledWith(successfulMessage).should.be.true();

            done();
          })
          .catch(function (err) {
            done(err);
          });
      });
    });

    it('should execute push and log a successful result', function (done) {
      pushControllerStub.push.returns(BPromise.resolve(pushControllerResult));

      run(function (pushCommand) {
        pushCommand.execute()
          .then(function () {
            pushControllerStub.push.calledOnce.should.be.true();
            pushControllerStub.push.firstCall.args.length.should.equal(0);

            messagesStub.status.calledOnce.should.be.true();
            messagesStub.status.calledWith(pushControllerResult)
              .should.be.true();

            loggerStub.info.calledOnce.should.be.true();
            loggerStub.info.calledWith(successfulMessage).should.be.true();

            done();
          })
          .catch(function (err) {
            done(err);
          });
      });
    });

    it('should execute push command and log a nothing result', function (done) {
      pushControllerStub.push.returns(BPromise.resolve(pushControllerEmptyResult));

      run(function (pushCommand) {
        pushCommand.execute()
          .then(function () {
            pushControllerStub.push.calledOnce.should.be.true();
            pushControllerStub.push.firstCall.args.length.should.equal(0);

            messagesStub.nothingPush.calledOnce.should.be.true();
            messagesStub.nothingPush.firstCall.args.length.should.equal(0);

            loggerStub.info.calledOnce.should.be.true();
            loggerStub.info.calledWithExactly(nothingMessage).should.be.true();

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
  container.register('pushController', pushControllerStub);
  container.register('validateSetupDoneStrategy', validateSetupDoneStrategyStub);
  container.resolve(callback);
}
