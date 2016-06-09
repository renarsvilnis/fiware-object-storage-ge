'use strict';

import test from 'ava';
import uuid from 'node-uuid';
// const debug = require('debug')('fiware-object-storage-ge:test');
// const fs = require('fs');
// const path = require('path');
// const mime = require('mime');

// import {readFilePromise, writeFilePromise} from './helpers';
import FiwareStorage from '../index';

/**
 * Config build from enviromental variables
 */
let config;
if (process.env.TRAVIS) {
  config = {
    container: process.env.FI_CONTAINER,
    user: process.env.FI_USER,
    password: process.env.FI_PASSWORD,
    region: process.env.FI_REGION
  };
} else {
  config = require('./config.json');
}

test.serial('initiate - should initiate', function * (t) {
  const storage = new FiwareStorage(config);

  yield t.notThrows(storage.initiate());

  // FIXME: succesffuly results if invalid region provided
});

test('setActiveContainer - should set active container', (t) => {
  const oldContainer = uuid.v4();
  const newContainer = uuid.v4();

  // create storage instance
  const _config = Object.assign({}, config, {container: oldContainer});
  const storage = new FiwareStorage(_config);

  t.is(storage.getActiveContainer(), oldContainer);

  storage.setActiveContainer(newContainer);
  t.is(storage.getActiveContainer(), newContainer);
});

test('getActiveContainer - should get current active container', (t) => {
  const container = uuid.v4();
  const storage = new FiwareStorage({container});
  t.is(storage.getActiveContainer(), container);
});

test.skip('lookupTenant', (t) => {});

test.serial('createContainer - should create container', function * (t) {
  const storage = new FiwareStorage(config);
  yield storage.initiate();

  const container = uuid.v4();

  // check if current container isn't the new one already
  t.not(storage.getActiveContainer(), container);

  yield t.notThrows(storage.createContainer(container));

  // createContainer should not have set the the new container as active
  t.not(storage.getActiveContainer(), container);

  // validate if container created
  const containers = yield storage.getContainerList();
  t.true(containers.indexOf(container) > -1);

  // cleanup
  yield storage.deleteContainer(container);
});

test.serial('createContainer - should create container and set it as active', function * (t) {
  const storage = new FiwareStorage(config);
  yield storage.initiate();

  const container = uuid.v4();

  // check if current container isn't the new one already
  t.not(storage.getActiveContainer(), container);

  yield t.notThrows(storage.createContainer(container, true));

  // createContainer should have set the the new container as active
  t.is(storage.getActiveContainer(), container);

  // cleanup
  yield storage.deleteContainer(container);
});

test.serial('deleteContainer', function * (t) {
  const storage = new FiwareStorage(config);
  yield storage.initiate();

  const container = uuid.v4();
  yield storage.createContainer(container);
  yield t.notThrows(storage.deleteContainer(container));
});

test.serial('getContainerList', function * (t) {
  const storage = new FiwareStorage(config);
  yield storage.initiate();

  const containers = yield storage.getContainerList();

  // TODO: add more tests

  t.true(Array.isArray(containers));
});

test.serial('listContainer - should list contents of container', function * (t) {
  const storage = new FiwareStorage(config);
  yield storage.initiate();

  const container = uuid.v4();

  // should throw when an container does not exist
  yield t.throws(storage.listContainer(container));

  // create a test container
  yield storage.createContainer(container, true);

  // should list empty container
  const items = yield storage.listContainer();
  t.true(Array.isArray(items));
  t.true(items.length === 0);

  // should list items when there is any
  //   .then((contents) => storage.putObject('test.json', mime.lookup('test.json'), contents, {hello: 'world'}))
  //   // Plain Text file
  //   .then(() => readFilePromise(path.join(__dirname, 'input', 'test.txt')))
  //   .then((contents) => storage.putObject('test.txt', mime.lookup('test.txt'), contents))
  //   // Image
  //   .then(() => readFilePromise(path.join(__dirname, 'input', 'test.png')))
  //   .then((contents) => storage.putObject('test.png', mime.lookup('test.png'), contents))

  // cleanup
  yield storage.deleteContainer(container);
});

test.skip('putObject', (t) => {});
test.skip('getObject', (t) => {});
test.skip('deleteObject', (t) => {});

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
