'use strict';

require('should');
var sinon = require('sinon');

var containerFactory  = require('../support/testContainerFactory');

var contextHolderStub = {};
var contextStub = {};
var superagentStub = {};

describe('csRepository', function () {
  beforeEach(function () {
    superagentStub.get = sinon.stub().returnsThis();
    superagentStub.post = sinon.stub().returnsThis();
    superagentStub.send = sinon.stub().returnsThis();
    superagentStub.set = sinon.stub().returnsThis();
    superagentStub.end = sinon.stub().returns(Promise.resolve({
      body: {}
    }));
  });

  describe('login', run(function (csRepository) {
    it('should login user', function (done) {
      csRepository.login('juan', 'test')
        .then(function () {
          superagentStub.post.called.should.be.true;
          superagentStub.post.firstCall.args[0]
            .should.match(/.*\/oauth2\/token$/);

          superagentStub.send.called.should.be.true;
          superagentStub.send.firstCall.args[0].username.should.match('juan');
          superagentStub.send.firstCall.args[0].password.should.match('test');

          superagentStub.set.called.should.be.true;
          superagentStub.set.firstCall.args[0].should.match('Accept');
          superagentStub.set.firstCall.args[1].should.match('application/json');

          superagentStub.end.called.should.be.true;

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
    });
    it('should get userInfo', function (done) {
      csRepository.getUserInfo()
        .then(function () {
          contextHolderStub.get.calledOnce.should.be.true;
          contextHolderStub.get.firstCall.args.length.should.equal(0);
          contextStub.getToken.calledOnce.should.be.true;
          contextStub.getToken.firstCall.args.length.should.equal(0);

          superagentStub.get.called.should.be.true;
          superagentStub.get.firstCall.args[0]
            .should.match(/.*\/api\/users\/me$/);

          superagentStub.set.called.should.be.true;
          superagentStub.set.firstCall.args[0].should.match('Authorization');
          superagentStub.set.firstCall.args[1].should.match(/Bearer.*/);

          superagentStub.end.called.should.be.true;

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
    container.resolve(callback);
  };
}
