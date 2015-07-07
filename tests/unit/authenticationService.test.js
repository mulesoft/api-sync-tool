'use strict';

var BPromise = require('bluebird');

require('should');
var sinon = require('sinon');

var containerFactory  = require('../support/testContainerFactory');

var csRepositoryStub = {};

describe('authenticationService', function () {
  beforeEach(function () {
    csRepositoryStub.login = sinon.stub().returns(BPromise.resolve());
  });

  describe('login', run(function (authenticationService) {
    it('should login user', function (done) {
      authenticationService.login('juan', 'test')
        .then(function () {
          csRepositoryStub.login.called.should.be.true();
          csRepositoryStub.login.firstCall.args[0].should.equal('juan');
          csRepositoryStub.login.firstCall.args[1].should.equal('test');

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
    container.register('csRepository', csRepositoryStub);
    container.resolve(callback);
  };
}
