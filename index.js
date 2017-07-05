'use strict';

global.Promise = require('pinkie-promise');

var spawn = require('child_process').spawn;
var concat = require('concat-stream');

module.exports = async function(cliPath, combo, options = {}) {
  const {waitBeforeStart = 1000} = options;
  var proc = spawn('node', [cliPath], { stdio: null });
  proc.stdin.setEncoding('utf-8');
  proc.stdout.setEncoding('utf-8');

  return new Promise((resolve, reject) => {
    return setTimeout(sendKeys(resolve, reject, {proc, combo, options}), waitBeforeStart);
  });
};

function sendKeys(resolve, reject, {proc, combo, options: {defaultTimeout = 200}}) {
  return () => {
    let stepIndex = 0;
    const steps = [];
    steps[stepIndex] = '';

    var loop = function(combo) {
      if (combo.length > 0) {
        const {key, timeout} = typeof combo[0] === 'string' ? {key: combo[0], timeout: defaultTimeout} : combo[0];
        setTimeout(function() {
          proc.stdout.pause();
          stepIndex++;
          steps[stepIndex] = '';
          proc.stdin.write(key);
          proc.stdout.resume();

          loop(combo.slice(1));
        }, timeout);
      } else {
        proc.stdin.end();
      }
    };

    loop(combo);

    proc.stdout.on('data', function(line) {
      steps[stepIndex] += line;
    });
    proc.stdout.on('close', function() {
      resolve(steps);
    });
    proc.stdout.on('error', reject);
  }
}

module.exports.DOWN = '\x1B\x5B\x42';
module.exports.UP = '\x1B\x5B\x41';
module.exports.ENTER = '\x0D';
