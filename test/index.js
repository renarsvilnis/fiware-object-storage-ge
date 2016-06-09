'use strict';

import test from 'ava';
// const debug = require('debug')('fiware-object-storage-ge:test');
// const fs = require('fs');
// const path = require('path');
// const mime = require('mime');

import FiwareStorage from '../index';
import config from './config.json';

test.skip('initiate', (t) => {});

test('setActiveContainer', (t) => {
  const oldContainer = 'old-container';
  const newContainer = 'new-container';

  // create storage instance
  const _config = Object.assign({}, config, {container: oldContainer});
  const storage = new FiwareStorage(_config);

  t.is(storage.getActiveContainer(), oldContainer);

  storage.setActiveContainer(newContainer);
  t.is(storage.getActiveContainer(), newContainer);
});

test('getActiveContainer', (t) => {
  const storage = new FiwareStorage({container: 'test'});
  t.is(storage.getActiveContainer(), 'test');
});

test.skip('lookupTenant', (t) => {});
test.skip('createContainer', (t) => {});
test.skip('deleteContainer', (t) => {});
test.skip('getContainerList', (t) => {});
test.skip('listContainer', (t) => {});
test.skip('putObject', (t) => {});
test.skip('getObject', (t) => {});
test.skip('deleteObject', (t) => {});
//
//
//
// /**
//  * fs.readFile promise wrapper
//  */
// function readFilePromise (file) {
//   return new Promise(function (resolve, reject) {
//     fs.readFile(file, function (err, buffer) {
//       if (err) {
//         return reject(err);
//       }
//
//       resolve(buffer);
//     });
//   });
// }
//
// /**
//  * fs.writeFile promise wrapper
//  */
// function writeFilePromise (filepath, filecontents) {
//   return new Promise((resolve, reject) => {
//     fs.writeFile(filepath, filecontents, function (err, written) {
//       if (err) {
//         return reject(err);
//       }
//
//       resolve();
//     });
//   });
// }
//
// // create storage instance
// const storage = objectStorage(config);
//
// /**
//  * Start the tests
//  */
// storage.initiate()
//   // lookup tenant
//   .then(() => storage.lookupTenant())
//   .then(debug.bind((debug, 'TenantID info:')))
//
//   // create container
//   .then(() => storage.createContainer(config.container))
//
//   // list available containers
//   .then(() => storage.getContainerList())
//   .then(debug.bind(debug, 'Containers:'))
//
//   // upload files
//   // JSON object
//   .then(() => readFilePromise(path.join(__dirname, 'input', 'test.json')))
//   .then((contents) => storage.putObject('test.json', mime.lookup('test.json'), contents, {hello: 'world'}))
//   // Plain Text file
//   .then(() => readFilePromise(path.join(__dirname, 'input', 'test.txt')))
//   .then((contents) => storage.putObject('test.txt', mime.lookup('test.txt'), contents))
//   // Image
//   .then(() => readFilePromise(path.join(__dirname, 'input', 'test.png')))
//   .then((contents) => storage.putObject('test.png', mime.lookup('test.png'), contents))
//
//   // list container objects
//   .then(() => storage.listContainer())
//   .then(debug.bind(debug, 'Container files:'))
//
//   // retrieve container object
//   // JSON object
//   .then(() => storage.getObject('test.json'))
//   .then((contents) => {
//     // debug fill contain additional metadata
//     debug(contents);
//     return contents;
//   })
//   .then((contents) => writeFilePromise(path.join(__dirname, 'out', 'test.json'), contents.value))
//   // Plain Text file
//   .then(() => storage.getObject('test.txt'))
//   .then((contents) => writeFilePromise(path.join(__dirname, 'out', 'test.txt'), contents.value))
//   // Image
//   .then(() => storage.getObject('test.png'))
//   .then((contents) => writeFilePromise(path.join(__dirname, 'out', 'test.png'), contents.value))
//
//   // delete object
//   .then(() => storage.deleteObject('test.json'))
//   .then(() => storage.deleteObject('test.txt'))
//   .then(() => storage.deleteObject('test.png'))
//
//   // remove container
//   .then(() => storage.deleteContainer(config.container))
//
//   .catch((err) => {
//     console.log(err.message);
//     console.error(err.stack);
//   });
