'use strict';

var should = require('should');
var sinon = require('sinon');

var containerFactory  = require('../support/testContainerFactory');

var localPath = '/Users/test';
var testFileName = 'testFile';
var contextHolderStub = {};
var contextStub = {};
var shaStub = {};
var fsStub = {};

var promisifyStub = function () {
  return function (otherFunction) {
    return otherFunction;
  };
};

describe('fileSystemRepository', function () {
  beforeEach(function () {
    contextStub.getDirectoryPath = sinon.stub().returns(localPath);
    contextHolderStub.get = sinon.stub().returns(contextStub);
  });

  describe('getFileFullPath', run(function (fileSystemRepository) {
    it('should return the full path of a file in the local repository',
      function (done) {
        try {
          var fullPath = fileSystemRepository.getFileFullPath(testFileName);
          calledOnceWithoutParameters([
            contextHolderStub.get,
            contextStub.getDirectoryPath
          ]);
          fullPath.should.equal(localPath + '/' + testFileName);

          done();
        } catch (err) {
          done(err);
        }
    });
  }));

  describe('getFileHash', run(function (fileSystemRepository) {
    var fileHash = 'hash';
    beforeEach(function () {
      shaStub.get = sinon.stub().returns(Promise.resolve(fileHash));
    });

    it('should return the hash of a file in the local repository',
      function (done) {
        fileSystemRepository.getFileHash(testFileName)
          .then(function (hash) {
            shaStub.get.calledOnce.should.be.true;
            shaStub.get.firstCall
              .calledWithExactly(fileSystemRepository
                .getFileFullPath(testFileName));
            hash.should.equal(fileHash);

            done();
          })
          .catch(function (err) {
            done(err);
          });
    });
  }));

  describe('getFilesPath', function () {
    describe('without empty workspace', run(function (fileSystemRepository) {
      beforeEach(function () {
        var fs = {};
        fs[localPath] = [
          'api1.raml',
          'api2.raml',
          'folder1'
        ];
        fs[localPath + '/folder1'] = [
          'api3.raml',
          'api4.raml',
          'folder2'
        ];
        fs[localPath + '/folder1/folder2'] = [];
        setFs(fs);
      });

      it('should return the file tree in the base directory leaving out empty folders',
        function (done) {
          fileSystemRepository.getFilesPath()
            .then(function (filePaths) {
              should.deepEqual(filePaths, ['/api1.raml',
                '/api2.raml',
                '/folder1/api3.raml',
                '/folder1/api4.raml']);
              done();
            })
            .catch(function (err) {
              done(err);
            });
      });

      it('should return the file tree in a directory leaving out empty folders',
        function (done) {
          fileSystemRepository.getFilesPath('/folder1')
            .then(function (filePaths) {
              should.deepEqual(filePaths, ['/folder1/api3.raml',
                '/folder1/api4.raml']);
              done();
            })
            .catch(function (err) {
              done(err);
            });
      });
    }));

    describe('with empty workspace', run(function (fileSystemRepository) {
      beforeEach(function () {
        var fs = {};
        fs[localPath] = [];
        setFs(fs);
      });

      it('should return the file tree in a directory leaving out empty folders',
          function (done) {
        fileSystemRepository.getFilesPath()
          .then(function (filePaths) {
            should.deepEqual(filePaths, []);
            done();
          })
          .catch(function (err) {
            done(err);
          });
      });
    }));

    function setFs(fs) {
      fsStub.readdir = function (dir) {
        return Promise.resolve(fs[dir]);
      };
      fsStub.stat = function (filePath) {
        return Promise.resolve({
          isDirectory: function () {
            return filePath in fs;
          }
        });
      };
    }
  });

  describe('createWriteStream', run(function (fileSystemRepository) {
    beforeEach(function () {
      fsStub.createWriteStream = sinon.stub().returns('stream');
    });

    it('it should call the fileSystem createWriteStream', function (done) {
      var filePath = 'file';
      try {
        var stream = fileSystemRepository.createWriteStream(filePath);
        stream.should.equal('stream');
        fsStub.createWriteStream.calledOnce.should.be.true;
        fsStub.createWriteStream.firstCall.calledWithExactly(
          localPath + '/' + filePath);

        done();
      } catch (err) {
        done(err);
      }
    });
  }));

  describe('removeFile', run(function (fileSystemRepository) {
    beforeEach(function () {
      fsStub.unlink = sinon.stub().returns(Promise.resolve('removed'));
    });

    it('it should call the fileSystem unlink', function (done) {
      var filePath = 'file';
      fileSystemRepository.removeFile(filePath)
        .then(function (result) {
          result.should.equal('removed');
          fsStub.unlink.calledOnce.should.be.true;
          fsStub.unlink.firstCall.calledWithExactly(
            localPath + '/' + filePath);

          done();
      })
      .catch(function (err) {
        done(err);
      });
    });
  }));
});

function calledOnceWithoutParameters(stubFunctions) {
  stubFunctions.forEach(function (stubFunction) {
    stubFunction.calledOnce.should.be.true;
    stubFunction.firstCall.args.length.should.equal(0);
  });
}

function run(callback) {
  return function () {
    var container = containerFactory.createContainer();
    container.register('contextHolder', contextHolderStub);
    container.register('sha', shaStub);
    container.register('fs', fsStub);
    container.register('promisify', promisifyStub);
    container.resolve(callback);
  };
}
