'use strict';

const debug = require('debug')('fiware-object-storage:test');
const fs = require('fs');

const ObjectStorage = require('./lib/index.js');

const config = {
  container: process.env.CONTAINER,
  user: process.env.USER,
  password: process.env.PASSWORD,
  region: process.env.REGION
};

// function to encode file data to base64 encoded string
// Reference: http://stackoverflow.com/a/28835460/1378261
// http://stackoverflow.com/questions/6182315/how-to-do-base64-encoding-in-node-js
function readFileToBase64 (file) {
  return new Promise(function (resolve, reject) {
    fs.readFile(file, function (err, buffer) {
      if (err) {
        return reject(err);
      }

      resolve(buffer.toString('base64'));
    });
  });
}

const objectStorage = ObjectStorage(config);

// const objectName = 'test.json';
// const objectContents = {'test': true};
// const objectMimetype = 'application/json';
// const objectMetadata = {additionalInfo: 'how about yes'};
const objectName = 'test.txt';
const objectContents = 'text file example';
const objectMimetype = null;
const objectMetadata = null;


readFileToBase64('./test-image.png')
  .then(console.log);

objectStorage.initiate()
  .then(() => objectStorage.createContainer(config.container))
  .then(() => objectStorage.putObject(objectName, objectMimetype, objectContents, objectMetadata))
  .then(() => objectStorage.listContainer())
  .then(debug.bind(debug, 'Container files:'))
  .then(() => objectStorage.getObject(objectName))
  .then(debug.bind(debug, 'File:'))
  // .then(() => objectStorage.deleteObject(objectName))
  // .then(() => objectStorage.deleteContainer(config.container))
  .catch((err) => {
    console.log(err.message);
    console.error(err.stack);
    // console.info(err);
  });
