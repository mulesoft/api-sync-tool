'use strict';

var winston = require('winston');
var path = require('path');
var osenv = require('osenv');

module.exports = function () {
  var logFileName = path.join(osenv.home(), '.api-sync.log');

  var logger = new (winston.Logger)({
    transports: [
      new (winston.transports.File)({
        filename: logFileName,
        json: false,
        formatter: function (options) {
          return '[' + options.level.toUpperCase() + '] ' + new Date() + ': ' +
            (options.message !== undefined ? options.message : '');
        }
      })
    ]
  });

  logger.onFlush = function (cb) {
    logger.transports.file.on('flush', cb);
  };

  return logger;
};
