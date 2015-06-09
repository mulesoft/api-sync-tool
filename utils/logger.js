'use strict';

var winston = require('winston');
var path = require('path');
var osenv = require('osenv');

module.exports = function () {
  var logFileName = path.join(osenv.home(), '.api-sync.log');

  var logger = new (winston.Logger)({
    transports: [
      new (winston.transports.Console)({
        level: 'info',
        formatter: function (options) {
          return options.message !== undefined ? options.message : '';
        }
      }),
      new (winston.transports.File)({
        level: 'debug',
        filename: logFileName,
        json: false,
        formatter: function (options) {
          return '[' + options.level.toUpperCase() + '] ' + new Date() + ': ' +
            (options.message !== undefined ? options.message : '');
        }
      })
    ]
  });

  logger.onComplete = function (message, cb) {
    logger.on('logging', function (transport, level, msg) {
      if (transport.name === 'file' && msg === message) {
        cb();
      }
    });
  };

  return logger;
};
