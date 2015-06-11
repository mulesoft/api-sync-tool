'use strict';

var winston = require('winston');
var path = require('path');
var osenv = require('osenv');
var _ = require('lodash');

module.exports = function () {
  var logFileName = path.join(osenv.home(), '.api-sync.log');

  var logger = new (winston.Logger)({
    transports: [
      new (winston.transports.Console)({
        level: 'info',
        formatter: function (options) {
          var message;
          if (_.isEmpty(options.meta)) {
            message = options.message ? options.message.toString() : '';
          } else {
            message = options.meta.toString();
          }

          return message;
        }
      }),
      new (winston.transports.File)({
        level: 'debug',
        filename: logFileName,
        json: false,
        formatter: function (options) {
          var message;
          if (_.isEmpty(options.meta)) {
            message = options.message ? options.message.toString() : '';
          } else {
            message = options.meta instanceof Error ? options.meta.stack : options.meta.toString();
          }

          return '[' + options.level.toUpperCase() + '] ' + new Date() + ': ' + message;
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
