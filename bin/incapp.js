#!/usr/bin/env node

var fs = require('fs'),
  util = require('util'),
  incarnatorApp = require('../main');

var command = process.argv[2];
var args;

var valueForPrint = function (value) {
  var quoteString = JSON.stringify;
  var str;;
  if (!value && value !== 0) {
    str = '';
  }
  else {
    str = String(value);
  }
  return quoteString(str);
}

if (command === 'push') {

  var args = require('commander').
    option('-d, --dir [value]', 'configuration directory', '.').
    option('-f, --force', 'force push even if incarnator hasn\'t changed', false).
    parse(process.argv);

  var dir = args.dir;
  var force = args.force;
  var url = args.args[1];

  var jsonConf = (function () {
    var retval;
    try {
      retval = incarnatorApp.dirToJsonConf(dir);
    }
    catch (e) {
      //util.debug('dir: ' + dir);
      console.error('error: failed to read from directory: ' + valueForPrint(dir));
      process.exit(2);
    }
    return retval;
  }());
  
  incarnatorApp.deploy(
    {
      jsonConf: jsonConf,
      incarnatorUrl: url,
      force: force
    }, 
    function (err) {
      if (err) {
        console.error('deploy failed');
        return;
      }
      console.error('deploy succeeded');
    }
  );
}
else {
  if (!command) {
    console.error('please supply an incapp command');
  }
  else {
    console.error(valueForPrint(command) + ' is not an incapp command');
  }
  process.exit(1);
}

