'use strict';

import test from 'ava';
import path from 'path';
import mime from 'mime';

import {readFilePromise, TempContainerManager} from './helpers';
import FiwareStorage from '../lib/index';

// #############################################################################
// Presetup
// #############################################################################

/**
 * Create a temporary container manager, which will clean containers
 * after tests, even if they fail
 */
const tempContainers = new TempContainerManager();

/**
 * Config depending on enviromental
 */
const config = !process.env.TRAVIS ? require('./config.json') : {
  container: process.env.FI_CONTAINER,
  user: process.env.FI_USER,
  password: process.env.FI_PASSWORD,
  region: process.env.FI_REGION
};

// #############################################################################
// Hooks
// #############################################################################

test.before('clean wupt', function * (t) {
  const storage = new FiwareStorage(config);
  yield storage.initiate();

  let containers = yield storage.getContainerList();
  containers = tempContainers.filterTestContainers(containers);

  yield containers.map((container) => storage.deleteContainer(container, true));
});

test.after.always('guaranteed cleanup', function * (t) {
  yield tempContainers.destroyAll();
});

// #############################################################################
// Tests
// #############################################################################

test('initiate - should initiate', function * (t) {
  const storage = new FiwareStorage(config);

  yield t.notThrows(storage.initiate());

  // FIXME: successfully results if invalid region provided
});

test('setActiveContainer - should set active container', (t) => {
  const oldContainer = tempContainers.generateName();
  const newContainer = tempContainers.generateName();

  // create storage instance
  const _config = Object.assign({}, config, {container: oldContainer});
  const storage = new FiwareStorage(_config);

  t.is(storage.getActiveContainer(), oldContainer);

  storage.setActiveContainer(newContainer);
  t.is(storage.getActiveContainer(), newContainer);
});

test('getActiveContainer - should get current active container', (t) => {
  const container = tempContainers.generateName();
  const storage = new FiwareStorage({container});
  t.is(storage.getActiveContainer(), container);
});

test.skip('lookupTenant', (t) => {
  // lookupTenant
});

test('createContainer - should create container', function * (t) {
  const storage = new FiwareStorage(config);
  yield storage.initiate();

  const container = tempContainers.create(config);

  // check if current container isn't the new one already
  t.not(storage.getActiveContainer(), container);

  yield t.notThrows(storage.createContainer(container));

  // createContainer should not have set the the new container as active
  t.not(storage.getActiveContainer(), container);

  // validate if container created
  const containers = yield storage.getContainerList();
  t.true(containers.indexOf(container) > -1);
});

test('createContainer - should create container and set it as active', function * (t) {
  const storage = new FiwareStorage(config);
  yield storage.initiate();

  const container = tempContainers.create(config);

  // check if current container isn't the new one already
  t.not(storage.getActiveContainer(), container);

  yield t.notThrows(storage.createContainer(container, true));

  // createContainer should have set the the new container as active
  t.is(storage.getActiveContainer(), container);
});

test('deleteContainer - should delete container', function * (t) {
  const storage = new FiwareStorage(config);
  yield storage.initiate();

  const container = tempContainers.create(config);
  yield storage.createContainer(container);
  yield t.notThrows(storage.deleteContainer(container));
});

test('getContainerList', function * (t) {
  const storage = new FiwareStorage(config);
  yield storage.initiate();

  const containers = yield storage.getContainerList();

  // TODO: add more tests

  t.true(Array.isArray(containers));
});

test.skip('deleteContainer - should force delete a container', function * (t) {

});

test('listContainer - should list contents of container', function * (t) {
  const storage = new FiwareStorage(config);
  yield storage.initiate();

  const container = tempContainers.create(config);

  // should throw when an container does not exist
  yield t.throws(storage.listContainer(container));

  // create a test container
  yield storage.createContainer(container, true);

  // should list empty container
  let items = yield storage.listContainer();
  t.true(Array.isArray(items));
  t.true(items.length === 0);

  const fileContents = yield readFilePromise(path.join(__dirname, 'input', 'test.txt'));
  yield storage.putObject('test.txt', mime.lookup('test.txt'), fileContents);

  items = yield storage.listContainer();
  t.true(Array.isArray(items));
  t.true(items.length === 1);
  t.is(items[0], 'test.txt');
});

test.skip('putObject', function * (t) {
  const storage = new FiwareStorage(config);
  yield storage.initiate();

  const container = tempContainers.create(config);

  // create a test container
  yield storage.createContainer(container, true);

  // handle images
  // const fileContents = yield readFilePromise(path.join(__dirname, 'input', 'test.txt'));
  // yield storage.putObject('test.txt', mime.lookup('test.txt'), fileContents);

  //   // upload files
  // JSON object
  // .then(() => readFilePromise(path.join(__dirname, 'input', 'test.json')))
  // .then((contents) => storage.putObject('test.json', mime.lookup('test.json'), contents, {hello: 'world'}))
  // // Plain Text file
  // .then(() => readFilePromise(path.join(__dirname, 'input', 'test.txt')))
  // .then((contents) => storage.putObject('test.txt', mime.lookup('test.txt'), contents))
  // // Image
  // .then(() => readFilePromise(path.join(__dirname, 'input', 'test.png')))
  // .then((contents) => storage.putObject('test.png', mime.lookup('test.png'), contents))
});
test.skip('getObject', (t) => {});

test('deleteObject - should delete objects', function * (t) {
  const storage = new FiwareStorage(config);
  yield storage.initiate();

  const container = tempContainers.create(config);

  // create a test container
  yield storage.createContainer(container, true);

  // validate container is empty
  let items = yield storage.listContainer();
  t.true(Array.isArray(items));
  t.true(items.length === 0);

  // uppload file
  const filename = 'test.txt';
  const filepath = path.join(__dirname, 'input', filename);
  const fileContents = yield readFilePromise(filepath);
  yield storage.putObject(filename, mime.lookup(filename), fileContents);

  // validate file has uploaded
  items = yield storage.listContainer();
  t.true(Array.isArray(items));
  t.true(items.length === 1);
  t.is(items[0], 'test.txt');

  // delete image
  yield t.notThrows(storage.deleteObject(filename));

  // validate container is empty again
  items = yield storage.listContainer();
  t.true(Array.isArray(items));
  t.true(items.length === 0);

  // cleanup
  t.notThrows(storage.deleteContainer(container));
});

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
  // .then(() => readFilePromise(path.join(__dirname, 'input', 'test.txt')))
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
