'use strict';

global.Promise = require('pinkie-promise');

var spawn = require('child_process').spawn;
var concat = require('concat-stream');

module.exports = function(cliPath, combo, timeout) {
  if (!timeout) {
    timeout = 300;
  }

  var proc = spawn('node', [cliPath], { stdio: 'pipe' });
  proc.stdin.setEncoding('utf-8');
  proc.stdout.setEncoding('utf-8');

  var loop = function(combo) {
    if (combo.length > 0) {
      setTimeout(function() {
        proc.stdin.write(combo[0]);
        loop(combo.slice(1));
      }, timeout);
    } else {
      proc.stdin.end();
    }
  };

  loop(combo);

  return new Promise(function(resolve, reject) {
    const steps = [];
    proc.stdout.on('data', function(line) {
      steps.push(line);
    })
    proc.stdout.on('close', function() {
      resolve(steps);
    })
    proc.stdout.on('error', reject);
  });
};

module.exports.DOWN = '\x1B\x5B\x42';
module.exports.UP = '\x1B\x5B\x41';
module.exports.ENTER = '\x0D';
