'use strict';

var should = require('should');
var sinon = require('sinon');

var asserts = require('../support/asserts');
var containerFactory  = require('../support/testContainerFactory');

var contextHolderStub = {};
var contextStub = {};
var errorsStub = {};
var fsStub = {};
var unzipStub = {};

var path = '/dir/';

describe('decompresser', function () {
  var compressedFilePath = 'pepe.zip';
  var expectedError = {error: 'pepe'};
  var unzipParameters = {
    path: path
  };
  var unzipResult = {};

  beforeEach(function () {
    fsStub.createReadStream = sinon.stub().returnsThis();
    fsStub.pipe = sinon.stub().returnsThis();
    fsStub.on = sinon.stub();
    contextStub.getDirectoryPath = sinon.stub().returns(path);
    contextHolderStub.get = sinon.stub().returns(contextStub);

    unzipStub.Extract = sinon.stub().returns(unzipResult);
  });

  describe('decompressFile', function () {
    it('should decompress a file', function (done) {
      fsStub.on.onThirdCall().callsArg(1);

      run(function (decompresser) {
        decompresser.decompressFile(compressedFilePath)
          .then(function (result) {
            (new should.Assertion(result)).undefined();
            assertUnzipping();

            done();
          })
          .catch(function (err) {
            done(err);
          });
      });
    });

    describe('decompress failure', function () {
      var expectedError = {error: 'pepe'};
      beforeEach(function () {
        errorsStub.DecompressError = sinon.stub().returns(expectedError);

        fsStub.on.onSecondCall().callsArg(1);
      });

      it('should catch the error', function (done) {
        run(function (decompresser) {
          decompresser.decompressFile(compressedFilePath)
            .then(function () {
              done('should have failed!');
            })
            .catch(function (err) {
              should.deepEqual(err, expectedError);
              assertUnzipping();

              done();
            })
            .catch(function (err) {
              done(err);
            });
        });
      });
    });

    describe('file reading failure', function () {
      var expectedError = {error: 'pepe'};
      beforeEach(function () {
        errorsStub.DecompressError = sinon.stub().returns(expectedError);

        fsStub.on.onFirstCall().callsArg(1);
      });

      it('should catch the error', function (done) {
        run(function (decompresser) {
          decompresser.decompressFile(compressedFilePath)
            .then(function () {
              done('should have failed!');
            })
            .catch(function (err) {
              should.deepEqual(err, expectedError);
              assertUnzipping();

              done();
            })
            .catch(function (err) {
              done(err);
            });
        });
      });
    });

    describe('unexpected error', function () {
      beforeEach(function () {
        fsStub.on.onThirdCall().throws(expectedError);
      });

      it('should catch the error', function (done) {
        run(function (decompresser) {
          decompresser.decompressFile(compressedFilePath)
            .then(function () {
              done('should have failed!');
            })
            .catch(function (err) {
              should.deepEqual(err, expectedError);
              assertUnzipping();

              done();
            })
            .catch(function (err) {
              done(err);
            });
        });
      });
    });
  });

  function assertUnzipping() {
    fsStub.on.calledThrice.should.be.true();

    asserts.calledOnceWithExactly(unzipStub.Extract, [
      unzipParameters
    ]);

    asserts.calledOnceWithExactly(fsStub.pipe, [
      unzipResult
    ]);
  }
});

function run(callback) {
  var container = containerFactory.createContainer();
  container.register('contextHolder', contextHolderStub);
  container.register('errors', errorsStub);
  container.register('fs', fsStub);
  container.register('unzip', unzipStub);
  container.resolve(callback);
}
