'use strict';

var should = require('should');
var fs = require('fs');
var path = require('path');
var containerFactory  = require('../support/testContainerFactory');

var propertiesFile = fs.readFileSync(path.join(__dirname, '..', 'support', 'assets', 'api-sync.test.properties'));

describe('propertiesParser', function () {
  it('should parse a properties formatted file', run(function (propertiesParser) {
    var apiWorkspaces = propertiesParser.parse(propertiesFile);

    assertWorkspaces(apiWorkspaces);
  }));

  it('should parse a properties formatted string', run(function (propertiesParser) {
    var apiWorkspaces = propertiesParser.parse(propertiesFile.toString());

    assertWorkspaces(apiWorkspaces);
  }));

  it('should return an empty array if undefined is passed', run(function (propertiesParser) {
    var apiWorkspaces = propertiesParser.parse();

    apiWorkspaces.should.be.an.Array;
    apiWorkspaces.length.should.equal(0);
  }));

  function assertWorkspaces(apiWorkspaces) {
    var index = 1;
    apiWorkspaces.should.be.an.Array;
    apiWorkspaces.length.should.equal(3);

    apiWorkspaces.forEach(function (apiWorkspace) {
      apiWorkspace.bizGroup.id.should.equal(index.toString());
      apiWorkspace.bizGroup.name.should.equal('bizGroup' + index);
      apiWorkspace.api.id.should.equal(index.toString());
      apiWorkspace.api.name.should.equal('api' + index);
      apiWorkspace.apiVersion.id.should.equal(index.toString());
      apiWorkspace.apiVersion.name.should.equal('version' + index);

      index++;
    });

    apiWorkspaces[0].files.should.be.an.Array;
    apiWorkspaces[0].files.length.should.equal(2);
    apiWorkspaces[1].files.should.be.an.Array;
    apiWorkspaces[1].files.length.should.equal(1);
    should(apiWorkspaces[2].files).not.be.ok;
  }
});

function run(callback) {
  return function () {
    var container = containerFactory.createContainer();
    container.resolve(callback);
  };
}
