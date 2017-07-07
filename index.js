'use strict';

global.Promise = require('pinkie-promise');

const spawn = require('child_process').spawn;
const concat = require('concat-stream');
const path = require('path');
let logger;

module.exports = async function(rootPath, combo, options = {}) {
  const loggerPath = path.resolve(rootPath, 'config/logger');
  const cliPath = path.resolve(rootPath, 'index');
  logger = require(loggerPath);

  const {waitBeforeStart = 1000} = options;
  const proc = spawn('node', [cliPath], { stdio: null });
  proc.stdin.setEncoding('utf-8');
  proc.stdout.setEncoding('utf-8');
  return new Promise((resolve, reject) => {
    return setTimeout(sendKeys(resolve, reject, {proc, cliPath, combo, options}), waitBeforeStart);
  });
};

function sendKeys(resolve, reject, {proc, combo, options: {defaultTimeout = 200, waitBeforeEnd = 1000}}) {
  return () => {
    let stepIndex = 0;
    const steps = [];
    steps[stepIndex] = '';

    const loop = function(combo) {
      if (combo.length > 0) {
        const {key, timeout} = typeof combo[0] === 'string' ? {key: combo[0], timeout: defaultTimeout} : combo[0];
        setTimeout(function() {
          proc.stdout.pause();
          logger.debug(steps[stepIndex]);
          stepIndex++;
          steps[stepIndex] = '';
          proc.stdin.write(key);
          proc.stdout.resume();
          loop(combo.slice(1));
        }, timeout);
      } else {
        setTimeout(() => {
          proc.stdin.end();
        }, waitBeforeEnd);
      }
    };

    loop(combo);

    proc.stdin.on('error', reject);
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
