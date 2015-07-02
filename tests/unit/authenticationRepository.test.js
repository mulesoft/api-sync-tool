'use strict';

var should = require('should');
var sinon = require('sinon');
var path = require('path');

var asserts = require('../support/asserts');
var containerFactory  = require('../support/testContainerFactory');

var fsStub = {};
var loggerStub = {};
var messagesStub = {};
var osenvStub = {};
var processStub = {};
var errorsStub = {};

describe('authenticationRepository', function () {
  var notFoundMessage = 'not found';
  var expectedPath = '/Users/test';
  var expectedAccessToken = 'adsasd3245678';

  var authFilePath = path.join(expectedPath, '.api-sync-auth');
  var fileEncoding = {encoding: 'utf8'};

  var unexpectedPath = '/fail';

  var propertiesString = '[directory0]\n' +
      'directory=' + expectedPath + '\n' +
      'accessToken=' + expectedAccessToken;

  var authenticationObject = {
    directory: expectedPath,
    accessToken: expectedAccessToken
  };

  beforeEach(function () {
    fsStub.readFileSync = sinon.stub();
    fsStub.writeFileSync = sinon.stub();

    processStub.cwd = sinon.stub();

    loggerStub.debug = sinon.stub();

    messagesStub.authFileNotFound = sinon.stub().returns(notFoundMessage);

    osenvStub.home = sinon.stub().returns(expectedPath);

    errorsStub.WriteFileError = sinon.stub().returns();
  });

  describe('get', run(function (authenticationRepository) {
    it('should return authentication', function (done) {
      fsStub.readFileSync.returns(propertiesString);
      processStub.cwd.returns(expectedPath);

      authenticationRepository.get()
        .then(function (authentication) {
          asserts.calledOnceWithoutParameters([
            osenvStub.home
          ]);

          asserts.calledOnceWithExactly(fsStub.readFileSync, [authFilePath,
            fileEncoding]);

          authentication.should.be.an.Object();
          should.deepEqual(authenticationObject, authentication);

          done();
        })
        .catch(function (err) {
          done(err);
        });
    });

    it('should create authentication when there is not one', function (done) {
      fsStub.readFileSync.onFirstCall().returns('');
      processStub.cwd.returns(expectedPath);

      authenticationRepository.get()
        .then(function (authentication) {
          osenvStub.home.calledOnce.should.be.true();

          asserts.calledOnceWithExactly(fsStub.readFileSync, [authFilePath,
            fileEncoding]);

          authentication.should.be.an.Object();
          authentication.directory.should.equal(expectedPath);

          done();
        })
        .catch(function (err) {
          done(err);
        });
    });

    it('should not create authentication file when there is no file',
        function (done) {
      fsStub.readFileSync.onFirstCall().throws();

      authenticationRepository.get()
        .then(function (authentication) {
          osenvStub.home.called.should.be.true();

          asserts.calledOnceWithExactly(fsStub.readFileSync, [authFilePath,
            fileEncoding]);

          asserts.notCalled([fsStub.writeFileSync]);

          authentication.should.be.an.Object();

          messagesStub.authFileNotFound.calledOnce.should.be.true();

          loggerStub.debug.calledOnce.should.be.true();
          loggerStub.debug.calledWithExactly(notFoundMessage).should.be.true();

          done();
        })
        .catch(function (err) {
          done(err);
        });
    });
  }));

  describe('update', run(function (authenticationRepository) {
    it('should update authentication', function (done) {
      fsStub.readFileSync.returns('');
      processStub.cwd.returns(expectedPath);

      authenticationRepository.update(authenticationObject)
        .then(function (authentication) {
          asserts.calledOnceWithExactly(fsStub.readFileSync, [authFilePath,
            fileEncoding]);
          asserts.calledOnceWithExactly(fsStub.writeFileSync, [authFilePath,
            sinon.match.string, fileEncoding]);

          osenvStub.home.calledTwice.should.be.true();

          authentication.should.be.an.Object();
          authentication.directory.should.equal(expectedPath);
          authentication.accessToken.should.equal(expectedAccessToken);

          done();
        })
        .catch(function (err) {
          done(err);
        });
    });

    it('should fail to update if directories do not match', function (done) {
      fsStub.readFileSync.returns('');
      processStub.cwd.returns(unexpectedPath);

      authenticationRepository.update(authenticationObject)
        .then(function () {
          done('This test should have failed');
        })
        .catch(function () {
          processStub.cwd.calledOnce.should.be.true();
          errorsStub.WriteFileError.calledWithNew().should.be.true();

          asserts.notCalled([fsStub.readFileSync, fsStub.writeFileSync]);

          done();
        })
        .catch(function (err) {
          done(err);
        });
    });
  }));

  describe('del', run(function (authenticationRepository) {
    it('should delete the authentication', function (done) {
      fsStub.readFileSync.returns(propertiesString);
      processStub.cwd.returns(expectedPath);

      authenticationRepository.del()
        .then(function () {
          asserts.calledOnceWithExactly(fsStub.readFileSync, [authFilePath,
            fileEncoding]);
          asserts.calledOnceWithExactly(fsStub.writeFileSync, [authFilePath,
            '', fileEncoding]);

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
    container.register('errors', errorsStub);
    container.register('fs', fsStub);
    container.register('logger', loggerStub);
    container.register('messages', messagesStub);
    container.register('osenv', osenvStub);
    container.register('process', processStub);
    container.resolve(callback);
  };
}
