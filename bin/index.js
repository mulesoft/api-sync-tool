#! /usr/bin/env node

'use strict';

var cli = require('../lib/api-sync');
var args = require('minimist')(process.argv.slice(2));

cli(args);
