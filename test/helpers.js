'use strict';

const fs = require('fs');
// const path = require('path');
// const mime = require('mime');

/**
 * [readFilePromise description]
 * @param  {string} file
 * @return {Buffer}      [description]
 */
export function readFilePromise (file) {
  return new Promise((resolve, reject) => {
    fs.readFile(file, (err, buffer) => err ? reject(err) : resolve(buffer));
  });
}

/**
 * fs.writeFile promise wrapper
 */
export function writeFilePromise (filepath, filecontents) {
  return new Promise((resolve, reject) => {
    fs.writeFile(filepath, filecontents, (err, written) => err ? reject(err) : resolve());
  });
}
