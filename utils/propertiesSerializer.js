'use strict';

var _ = require('lodash');
var os = require('os');

module.exports = function () {
  return {
    serialize: serialize
  };

  /**
   * Serialize a JS Array into a properties formatted string.
   * @param  {Array} array Then input array
   * @return {String} The properties formatted string.
   */
  function serialize(array) {
    var outputString = '';
    var i = 0;
    array.forEach(function (item) {
      outputString += '[' + i + ']' + os.EOL;
      outputString += serializeItem(item);
      i++;
    });

    return outputString;
  }

  /**
   * Serializes a JS Object/Array/String into a properties formatted string.
   * @param  {Object} item The object to serialize.
   * @param  {String} prefix A string with the current prefix for the property key.
   * @return {String} A properties formatted representation of the specified item.
   */
  function serializeItem(item, prefix) {
    var result = '';

    if (_.isArray(item)) {
      result += serializeArray(item, prefix);
    } else if (_.isPlainObject(item)) {
      result += serializeObject(item, prefix);
    } else {
      result += prefix + '=' + item + os.EOL;
    }

    return result;
  }

  /**
   * Serializes a JS Array.
   * @param  {Array} array A JS Array.
   * @param  {String} prefix A string with the current prefix for the property key.
   * @return {String} A properties formatted representation of the specified array.
   */
  function serializeArray(array, prefix) {
    var i = 0;
    var result = '';
    array.forEach(function (item) {
      result += serializeItem(item, prefix + '[' + i + ']');
      i++;
    });

    return result;
  }

  /**
   * Serializes a JS Object.
   * @param  {Object} object A JS Object.
   * @param  {String} prefix A string with the current prefix for the property key.
   * @return {String} A properties formatted representation of the specified object.
   */
  function serializeObject(object, prefix) {
    var result = '';
    _.forOwn(object, function (value, key) {
      var path = prefix ? prefix + '.' : '';
      result += serializeItem(value, path + key);
    });

    return result;
  }
};
