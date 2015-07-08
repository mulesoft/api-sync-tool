'use strict';

var BPromise = require('bluebird');

var should = require('should');
var sinon = require('sinon');

var path = require('path');

var asserts = require('../support/asserts');
var containerFactory  = require('../support/testContainerFactory');

var localPath = '/Users/test';
var testFileName = 'testFile';
var contextHolderStub = {};
var contextStub = {};
var shaStub = {};
var fsStub = {};

describe('fileSystemRepository', function () {
  beforeEach(function () {
    contextStub.getDirectoryPath = sinon.stub().returns(localPath);
    contextHolderStub.get = sinon.stub().returns(contextStub);
  });

  describe('getFile', run(function (fileSystemRepository) {
    it('should return the specified file', function (done) {
      var filePath = 'pepe';
      var fileData = 'data';

      fsStub.readFile = sinon.stub().returns(BPromise.resolve(fileData));

      fileSystemRepository.getFile(filePath)
        .then(function (result) {
          asserts.calledOnceWithoutParameters([
            contextHolderStub.get,
            contextStub.getDirectoryPath
          ]);
          asserts.calledOnceWithExactly(fsStub.readFile,
            [path.join(localPath, filePath), 'utf8']);

          result.should.be.an.Object();
          result.path.should.equal(filePath);
          result.data.should.equal(fileData);

          done();
        })
        .catch(function (err) {
          done(err);
        });
    });
  }));

  describe('getFileFullPath', run(function (fileSystemRepository) {
    it('should return the full path of a file in the local repository',
      function (done) {
        try {
          var fullPath = fileSystemRepository.getFileFullPath(testFileName);
          asserts.calledOnceWithoutParameters([
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
      shaStub.get = sinon.stub().returns(BPromise.resolve(fileHash));
    });

    it('should return the hash of a file in the local repository',
      function (done) {
        fileSystemRepository.getFileHash(testFileName)
          .then(function (hash) {
            shaStub.get.calledOnce.should.be.true();
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

  describe('getDirectoriesPath', function () {
    describe('without empty workspace', run(function (fileSystemRepository) {
      beforeEach(function () {
        var fs = {};
        fs[localPath] = [
          'api1.raml',
          'api2.raml',
          'folder1',
          '.ignorefolder',
          'ignoreFilesFolder'
        ];
        fs[localPath + '/folder1'] = [
          'api3.raml',
          'api4.raml',
          'folder2'
        ];
        fs[localPath + '/folder1/folder2'] = [];
        fs[localPath + '/ignoreFilesFolder'] = [
          '.gitignore',
          'one.file',
          '.git',
          'valid'
        ];
        fs[localPath + '/ignoreFilesFolder/valid'] = [
          'valid.raml'
        ];
        fs[localPath + '/ignoreFilesFolder/.git'] = [
          'gitmetadata'
        ];
        fs[localPath + '/.ignorefolder'] = [
          'ignorefolder2'
        ];
        fs[localPath + '/.ignorefolder/ignorefolder2'] = [
          'ignoreFile'
        ];
        setFs(fs);
      });

      it('should return the directories tree in the base directory leaving out dot folders',
        function (done) {
          fileSystemRepository.getDirectoriesPath()
            .then(function (directoriesPaths) {
              should.deepEqual(directoriesPaths, [
                '/folder1/folder2',
                '/folder1',
                '/ignoreFilesFolder/valid',
                '/ignoreFilesFolder']);
              done();
            })
            .catch(function (err) {
              done(err);
            });
      });

      it('should return the file tree in a directory',
        function (done) {
          fileSystemRepository.getDirectoriesPath('/folder1')
            .then(function (directoriesPaths) {
              should.deepEqual(directoriesPaths, ['/folder1/folder2']);
              done();
            })
            .catch(function (err) {
              done(err);
            });
      });

      it('should return the file tree in a directory ignoring paths starting with a dot',
        function (done) {
          fileSystemRepository.getDirectoriesPath('/ignoreFilesFolder')
            .then(function (directoriesPaths) {
              should.deepEqual(directoriesPaths, ['/ignoreFilesFolder/valid']);

              done();
            })
            .catch(function (err) {
              done(err);
            });
        });
    }));
  });

  describe('getFilesPath', function () {
    describe('without empty workspace', run(function (fileSystemRepository) {
      beforeEach(function () {
        var fs = {};
        fs[localPath] = [
          'api1.raml',
          'api2.raml',
          'api1.meta',
          'folder1',
          'ignoreFilesFolder'
        ];
        fs[localPath + '/folder1'] = [
          'api3.raml',
          'api4.raml',
          'api4.meta',
          'folder2'
        ];
        fs[localPath + '/folder1/folder2'] = [];
        fs[localPath + '/ignoreFilesFolder'] = [
          '.gitignore',
          'one.file',
          'one.meta',
          '.git',
          'valid'
        ];
        fs[localPath + '/ignoreFilesFolder/valid'] = [
          'valid.raml'
        ];
        fs[localPath + '/ignoreFilesFolder/.git'] = [
          'gitmetadata'
        ];
        setFs(fs);
      });

      it('should return the file tree in the base directory leaving out empty folders',
        function (done) {
          fileSystemRepository.getFilesPath()
            .then(function (filePaths) {
              should.deepEqual(filePaths, ['/api1.raml',
                '/api2.raml',
                '/folder1/api3.raml',
                '/folder1/api4.raml',
                '/ignoreFilesFolder/one.file',
                '/ignoreFilesFolder/valid/valid.raml'
              ]);
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

      it('should return the file tree in a directory ignoring paths starting ' +
          'with a dot and files with meta extension',
        function (done) {
          fileSystemRepository.getFilesPath('/ignoreFilesFolder')
            .then(function (filePaths) {
              should.deepEqual(filePaths, [
                '/ignoreFilesFolder/one.file',
                '/ignoreFilesFolder/valid/valid.raml'
              ]);

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
  });

  function setFs(fs) {
    fsStub.readdir = function (dir) {
      return BPromise.resolve(fs[dir]);
    };
    fsStub.stat = function (filePath) {
      return BPromise.resolve({
        isDirectory: function () {
          return filePath in fs;
        }
      });
    };
  }

  describe('createWriteStream', run(function (fileSystemRepository) {
    beforeEach(function () {
      fsStub.createWriteStream = sinon.stub().returns('stream');
    });

    it('it should call the fileSystem createWriteStream', function (done) {
      var filePath = 'file';
      try {
        var stream = fileSystemRepository.createWriteStream(filePath);
        stream.should.equal('stream');
        fsStub.createWriteStream.calledOnce.should.be.true();
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
      fsStub.unlink = sinon.stub().returns(BPromise.resolve('removed'));
    });

    it('it should call the fileSystem unlink', function (done) {
      var filePath = 'file';
      fileSystemRepository.removeFile(filePath)
        .then(function (result) {
          result.should.equal('removed');
          fsStub.unlink.calledOnce.should.be.true();
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

function run(callback) {
  return function () {
    var container = containerFactory.createContainer();
    container.register('contextHolder', contextHolderStub);
    container.register('sha', shaStub);
    container.register('fs', fsStub);
    container.resolve(callback);
  };
}
