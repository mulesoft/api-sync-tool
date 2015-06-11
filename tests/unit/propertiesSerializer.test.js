'use strict';

require('should');
var os = require('os');

var containerFactory  = require('../support/testContainerFactory');
var contentGenerator  = require('../support/contentGenerator');

describe('propertiesSerializer', function () {
  it('should serialize a workspaces array', run(function (propertiesSerializer) {
    var workspace = contentGenerator.generateWorkspace();
    workspace.directory = 'dir1';
    workspace.file = [
      {
        path: '/file.raml',
        hash: 'adsfghjklñ'
      }
    ];
    var workspaces = [workspace];

    var propertiesString = propertiesSerializer.serialize(workspaces);

    var lines = propertiesString.split(os.EOL);
    lines[0].should.equal('[0]');
    lines[1].should.equal('api.id=1234');
    lines[2].should.equal('apiVersion.id=1234');
    lines[3].should.equal('bizGroup.id=1234');
    lines[4].should.equal('directory=dir1');
  }));
});

function run(callback) {
  return function () {
    var container = containerFactory.createContainer();
    container.resolve(callback);
  };
}
