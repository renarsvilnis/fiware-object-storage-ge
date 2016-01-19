'use strict';

const ObjectStorage = require('./lib/index.js');

const config = {
  // IP of the Object Storage GE, e.g. "api2.xifi.imaginlab.fr"
  // (FIWARE Lannion2)
  // url: '130.206.120.56',
  // http://stackoverflow.com/a/31808805/1378261
  url: '172.32.0.144',
  // IP of the Auth Services, likely "cloud.lab.fi-ware.org"
  // auth: 'cloud.lab.fi-ware.org',
  auth: 'cloud.lab.fiware.org:4730',
  // Whatever container you want to connect to
  container: process.env.CONTAINER,
  user: process.env.USER,
  password: process.env.PASSWORD,
  region: 'Spain2'
};

const objectStorage = new ObjectStorage(config);
