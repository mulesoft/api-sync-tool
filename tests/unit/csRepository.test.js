'use strict';

var BPromise = require('bluebird');

var should = require('should');
var sinon = require('sinon');

var containerFactory  = require('../support/testContainerFactory');

var contextHolderStub = {};
var contextStub = {};
var superagentStub = {};
var errorsStub = {};

describe('csRepository', function () {
  var username = 'juan';
  var password = 'test';
  var accessToken = '1234567';

  beforeEach(function () {
    superagentStub.get = sinon.stub().returnsThis();
    superagentStub.post = sinon.stub().returnsThis();
    superagentStub.send = sinon.stub().returnsThis();
    superagentStub.set = sinon.stub().returnsThis();
    superagentStub.end = sinon.stub();

    errorsStub.BadCredentialsError = sinon.stub();
    errorsStub.LoginError = sinon.stub();
  });

  describe('login', run(function (csRepository) {
    it('should login user', function (done) {
      superagentStub.end.returns(BPromise.resolve({
        body: {
          access_token: accessToken
        }
      }));

      csRepository.login(username, password)
        .then(function (authentication) {
          superagentStub.post.called.should.be.true();
          superagentStub.post.firstCall.args[0]
            .should.match(/.*\/oauth2\/token$/);

          superagentStub.send.calledOnce.should.be.true();
          superagentStub.send.calledWithExactly(sinon.match({
            username: username,
            password: password
          })).should.be.true();

          superagentStub.set.calledOnce.should.be.true();
          superagentStub.set.calledWithExactly('Accept', 'application/json');

          superagentStub.end.calledOnce.should.be.true();

          authentication.should.be.an.Object();
          authentication.accessToken.should.equal(accessToken);

          done();
        })
        .catch(function (err) {
          done(err);
        });
    });

    it('should fail when credentials are wrong', function (done) {
      superagentStub.end.returns(BPromise.reject({
        status: 400
      }));

      csRepository.login(username, password)
        .then(function () {
          done('Test should fail');
        })
        .catch(function (error) {
          superagentStub.post.called.should.be.true();
          superagentStub.post.firstCall.args[0]
            .should.match(/.*\/oauth2\/token$/);

          superagentStub.send.calledOnce.should.be.true();
          superagentStub.send.calledWithExactly(sinon.match({
            username: username,
            password: password
          })).should.be.true();

          superagentStub.set.calledOnce.should.be.true();
          superagentStub.set.calledWithExactly('Accept', 'application/json');

          superagentStub.end.calledOnce.should.be.true();

          errorsStub.LoginError.calledOnce.should.be.true();
          errorsStub.LoginError.calledWithExactly(username).should.be.true();

          error.should.be.an.LoginError;

          done();
        })
        .catch(function (err) {
          done(err);
        });
    });

    it('should fail with other errors', function (done) {
      superagentStub.end.returns(BPromise.reject({
        status: 404
      }));

      csRepository.login(username, password)
        .then(function () {
          done('Test should fail');
        })
        .catch(function (error) {
          superagentStub.post.called.should.be.true();
          superagentStub.post.firstCall.args[0]
            .should.match(/.*\/oauth2\/token$/);

          superagentStub.send.calledOnce.should.be.true();
          superagentStub.send.calledWithExactly(sinon.match({
            username: username,
            password: password
          })).should.be.true();

          superagentStub.set.calledOnce.should.be.true();
          superagentStub.set.calledWithExactly('Accept', 'application/json');

          superagentStub.end.calledOnce.should.be.true();

          error.should.be.an.Object();
          error.status.should.equal(404);

          done();
        })
        .catch(function (err) {
          done(err);
        });
    });
  }));

  describe('userInfo', run(function (csRepository) {
    beforeEach(function () {
      contextStub.getToken = sinon.stub().returns('token');
      contextHolderStub.get = sinon.stub().returns(contextStub);
      superagentStub.end.returns(BPromise.resolve({
        body: {}
      }));
    });

    it('should get userInfo', function (done) {
      csRepository.getUserInfo()
        .then(function () {
          contextHolderStub.get.calledOnce.should.be.true();
          contextHolderStub.get.firstCall.args.length.should.equal(0);
          contextStub.getToken.calledOnce.should.be.true();
          contextStub.getToken.firstCall.args.length.should.equal(0);

          superagentStub.get.calledOnce.should.be.true();
          superagentStub.get.calledWithExactly(
              sinon.match(/.*\/api\/users\/me$/)).should.be.true();

          superagentStub.set.calledOnce.should.be.true();
          superagentStub.set.calledWithExactly('Authorization',
              sinon.match(/Bearer.*/)).should.be.true();

          superagentStub.end.calledOnce.should.be.true();

          done();
        })
        .catch(function (err) {
          done(err);
        });
    });

    it('should manage errors correctly', function (done) {
      superagentStub.end.returns(BPromise.reject({
        status: 401
      }));

      csRepository.getUserInfo()
        .then(function () {
          done('Should have failed');
        })
        .catch(function () {
          superagentStub.get.calledOnce.should.be.true();
          superagentStub.get.calledWithExactly(
            sinon.match(/.*\/api\/users\/me$/)).should.be.true();

          superagentStub.end.calledOnce.should.be.true();

          errorsStub.BadCredentialsError.calledWithNew().should.be.true();

          done();
        })
        .catch(function (err) {
          done(err);
        });
    });

    it('should manage unknown errors correctly', function (done) {
      var customError = {
        status: 400
      };
      superagentStub.end.returns(BPromise.reject(customError));

      csRepository.getUserInfo()
        .then(function () {
          done('Should have failed');
        })
        .catch(function (error) {
          superagentStub.get.calledOnce.should.be.true();
          superagentStub.get.calledWithExactly(
            sinon.match(/.*\/api\/users\/me$/)).should.be.true();

          should.deepEqual(error, customError);

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
    container.register('contextHolder', contextHolderStub);
    container.register('superagent', superagentStub);
    container.register('errors', errorsStub);
    container.resolve(callback);
  };
}
