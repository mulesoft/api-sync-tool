#! /usr/bin/env node

'use strict';

var cli = require('./api-sync');
var args = require('minimist')(process.argv.slice(2));

cli(args);
