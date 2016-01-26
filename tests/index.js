'use strict';

const debug = require('debug')('fiware-object-storage-ge:test');
const fs = require('fs');
const path = require('path')
const mime = require('mime');

const objectStorage = require('../lib/index.js');

/**
 * Config build from enviromental variables
 */
const config = {
  container: process.env.CONTAINER,
  user: process.env.USER,
  password: process.env.PASSWORD,
  region: process.env.REGION
};

/**
 * fs.readFile promise wrapper
 */
function readFilePromise (file) {
  return new Promise(function (resolve, reject) {
    fs.readFile(file, function (err, buffer) {
      if (err) {
        return reject(err);
      }

      resolve(buffer);
    });
  });
}

// create storage instance
const storage = objectStorage(config);

const objectName = 'test.json';
// const objectName = 'test.png';
// const objectName = 'test.txt';

const objectPath = path.join(__dirname, `input/${objectName}`);

const objectMimetype = mime.lookup(objectName);

storage.initiate()
  // create container
  .then(() => storage.createContainer(config.container))

  .then(() => storage.getContainerList())
  .then(debug.bind(debug, 'Containers:'))

  // upload file
  .then(() => readFilePromise(objectPath))
  .then((objectContents) => storage.putObject(objectName, objectMimetype, objectContents))
  .then((res) => {
    console.log(res);
  })

  // list container objects
  .then(() => storage.listContainer())
  // .then(debug.bind(debug, 'Container files:'))
  .then((items) => {

    console.log('t', typeof items);
    console.log('l', items.length);
    console.log(items);
  })

  // retrieve container object
  .then(() => storage.getObject(objectName))
  .then((objectContents) => {
    // return new Promise((resolve, reject) => {
    //   const filename = `./out/${Date.now()}-${objectName}`;

    //   console.log(objectContents.toString('base64'));
    //   console.log(typeof objectContents.toString('base64'));

    //   console.log(filename);
    //   fs.writeFile(filename, objectContents, function (err, written) {
    //     if (err) {
    //       return reject(err);
    //     }

    //     resolve();
    //   });
    // });
  })

  // delete object
  // .then(() => storage.deleteObject(objectName))

  // remove container
  // .then(() => storage.deleteContainer(config.container))

  .catch((err) => {
    console.log(err.message);
    console.error(err.stack);
  });
