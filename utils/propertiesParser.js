'use strict';

var _ = require('lodash');
var os = require('os');

var SECTION_HEADER_REGEX = /^\[.*\]$/;
var ARRAY_PROPERTY_REGEX = /(.*)\[(.*)\]$/;

module.exports = function () {
  return {
    parse: parse
  };

  /**
   * Parses a properties formatted string into JS objects.
   *
   * @param  {String|Object} input The input to be parsed.
   * @return {Array} The result of the parse process.
   */
  function parse(input) {
    var string;
    if (_.isString(input)) {
      string = input;
    } else {
      string = input ? input.toString() : '';
    }

    // Get lines
    var lines = string ? string.split(os.EOL) : [];
    var array = [];

    lines.forEach(function (line) {
      if (!_.isEmpty(line)) {
        // If line is a section header
        if (SECTION_HEADER_REGEX.test(line)) {
          // Add a new empty object for the section.
          array.push({});
        } else {
          // Parse the line.
          parseLine(line, array[array.length - 1]);
        }
      }
    });
    return array;
  }

  /**
   * Parses a property formatted line.
   * @param  {String} line The line string.
   * @param  {Object} sectionObject The current properties section object.
   * @return {[type]}       [description]
   */
  function parseLine(line, sectionObject) {
    var parts = line.split('=');
    var keyParts = parts[0].split('.');
    var value = parts[1];
    var lastKeyPart = keyParts.splice(keyParts.length - 1, 1);

    var currentObject = getObjectForKey(sectionObject, keyParts);
    // Save property in currentObject.
    currentObject[lastKeyPart[0]] = value;
  }

  /**
   * Returns an object representation for the specified key parts.
   * @param  {Object} sectionObject The current properties section object.
   * @param  {Array} keyParts An array with the different parts in a properties key.
   * @return {Object} An object representing the specified key.
   */
  function getObjectForKey(sectionObject, keyParts) {
    keyParts.forEach(function (keyPart) {
      // If line matches the array representation.
      var match = keyPart.match(ARRAY_PROPERTY_REGEX);
      if (match) {
        var property = match[1];
        var index = match[2];

        // If property is not in the object.
        if (!sectionObject[property]) {
          // Initialize the array.
          sectionObject[property] = [];
        }

        // If index is not in the array.
        if (!sectionObject[property][index]) {
          // Initialize with empty object.
          sectionObject[property].push({});
        }

        // Store currentObject.
        sectionObject = sectionObject[property][index];
      } else {
        // If the propery is not in the object.
        if (!sectionObject[keyPart]) {
          // Initialize with empty object.
          sectionObject[keyPart] = {};
        }

        // Store current object.
        sectionObject = sectionObject[keyPart];
      }
    });

    return sectionObject;
  }
};
