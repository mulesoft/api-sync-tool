'use strict';

var BPromise = require('bluebird');

var should = require('should');
var sinon = require('sinon');

var asserts = require('../support/asserts');
var containerFactory  = require('../support/testContainerFactory');

var errorsStub = {};
var AdmZipStub;
var zipStub = {};
var BPromiseStub = {};
var decompresserResult = 'pepe';

describe('decompresser', function () {
  beforeEach(function () {
    AdmZipStub = sinon.stub().returns(zipStub);
    BPromiseStub.promisify = sinon.stub().returnsArg(0);
    zipStub.extractAllToAsync =
      sinon.stub().returns(BPromise.resolve(decompresserResult));
  });

  describe('decompressFile', function () {
    var extractDirectoryPath = 'folder';
    var compressedFilePath = 'pepe.zip';

    it('should decompress a file', function (done) {
      run(function (decompresser) {
        decompresser.decompressFile(extractDirectoryPath, compressedFilePath)
          .then(function (result) {
            should.deepEqual(result, decompresserResult);
            asserts.calledOnceWithExactly(AdmZipStub, [compressedFilePath]);
            asserts.calledOnceWithExactly(BPromiseStub.promisify, [
              zipStub.extractAllToAsync
            ]);
            asserts.calledOnceWithExactly(zipStub.extractAllToAsync, [
              extractDirectoryPath,
              true
            ]);
            done();
          })
          .catch(function (err) {
            done(err);
          });
      });
    });

    describe('zip failure', function () {
      var expectedError = {error: 'pepe'};
      beforeEach(function () {
        AdmZipStub = sinon.stub().throws(expectedError);
        BPromiseStub.reject =
          sinon.stub().returns(BPromise.reject(expectedError));
        errorsStub.DecompressError = sinon.stub().returns(expectedError);
      });

      it('should catch the error', function (done) {
        run(function (decompresser) {
          decompresser.decompressFile(extractDirectoryPath, compressedFilePath)
            .then(function () {
              done('should have failed!');
            })
            .catch(function (err) {
              should.deepEqual(err, expectedError);

              asserts.calledOnceWithExactly(BPromiseStub.reject, [
                expectedError
              ]);

              errorsStub.DecompressError.calledWithNew().should.be.true();
              asserts.calledOnceWithExactly(errorsStub.DecompressError, [
                compressedFilePath,
                expectedError
              ]);

              asserts.notCalled([
                BPromiseStub.promisify,
                zipStub.extractAllToAsync
              ]);

              done();
            }).catch(function (err) {
              done(err);
            });
        });
      });
    });

    describe('decompress failure', function () {
      var expectedError = {error: 'pepe'};
      beforeEach(function () {
        BPromiseStub.reject =
          sinon.stub().returns(BPromise.reject(expectedError));
        errorsStub.DecompressError = sinon.stub().returns(expectedError);
        zipStub.extractAllToAsync =
          sinon.stub().returns(BPromise.reject(expectedError));
      });

      it('should catch the error', function (done) {
        run(function (decompresser) {
          decompresser.decompressFile(extractDirectoryPath, compressedFilePath)
            .then(function () {
              done('should have failed!');
            })
            .catch(function (err) {
              should.deepEqual(err, expectedError);

              asserts.calledOnceWithExactly(BPromiseStub.reject, [
                expectedError
              ]);

              errorsStub.DecompressError.calledWithNew().should.be.true();
              asserts.calledOnceWithExactly(errorsStub.DecompressError, [
                compressedFilePath,
                expectedError
              ]);

              asserts.calledOnceWithExactly(AdmZipStub, [compressedFilePath]);
              asserts.calledOnceWithExactly(BPromiseStub.promisify, [
                zipStub.extractAllToAsync
              ]);
              asserts.calledOnceWithExactly(zipStub.extractAllToAsync, [
                extractDirectoryPath,
                true
              ]);

              done();
            }).catch(function (err) {
              done(err);
            });
        });
      });
    });
  });
});

function run(callback) {
  var container = containerFactory.createContainer();

  container.register('AdmZip', function () {
    return AdmZipStub;
  });
  container.register('BPromise', BPromiseStub);
  container.register('errors', errorsStub);
  container.resolve(callback);
}
