# fiware-object-storage-ge

> A promise based Node.js module for read/write access to the FIWARE Object Storage GE

![NPM](https://nodei.co/npm/fiware-object-storage-ge.png?downloads=true)
![Build status](https://img.shields.io/travis/renarsvilnis/fiware-object-storage-ge.svg)
[![Coverage Status](https://coveralls.io/repos/github/renarsvilnis/fiware-object-storage-ge/badge.svg?branch=master)](https://coveralls.io/github/renarsvilnis/fiware-object-storage-ge?branch=master)

Started as a fork of [arvidkahl/fiware-object-storage](https://github.com/arvidkahl/fiware-object-storage) repository ended up as a ground up rewrite referencing the [FIWARE python example](https://forge.fiware.org/plugins/mediawiki/wiki/fiware/index.php/Object_Storage_-_User_and_Programmers_Guide#Example_Python).

## Installation

> Requires either an lts node versions of `v4.*` or `v5.*` or later

``` bash
npm install --save fiware-object-storage-ge
```

## Usage

```javascript
'use script';

const fiwareObjectStorage = require('fiware-object-storage-ge');

const config = {
  // IP of the Auth Services, no need to pass it explicitly 99%
  // By defaults "cloud.lab.fiware.org:4730"
  auth: 'cloud.lab.fiware.org:4730'
  // Default container you want to work with, as convenience
  container: 'my-container',           
  // Your FIWARE account email
  user: 'john.rambo@usa.gov',
  // Your FIWARE account password
  password: 'Yourw0rstn1ghtmare',
  // The region where the storage instace is located in
  // By default "Spain2"
  region: 'Spain2',
  // Note: tenant option not yet implemented
  // tenant: '<string>'
};

// Create a new fiware object storage instance and passing the config.
// It allows to have multiple instances.
// Recommended to create a singleton module that exports the instance,
// so that authentication happens only once
const storage = fiwareObjectStorage(config);

// Initiate the instance by fetching the authentification tokens and tenants.
// Recommended to do it on the launch of the server.
storage.initiate()
    // then fetch all files from the container and output them with console.log
    .then(() => storage.listContainer())
    .then((items) => console.log(items))
    // errors are returned as a Error class instance
    .catch(console.error);
```

This module uses [debug](https://www.npmjs.com/package/debug) for debugging, if you wan't to see what the module is doing under the hood in a case where something isn't working, pass an `DEBUG` enviromental variable when launching your server as following:

```bash
# Debug just the fiware-object-storage-ge
DEBUG=fiware-object-storage-ge node server.js
# Debug everything, for a more detailed explanation reference the debug repository
DEBUG=* node server.js
```

## Methods

> All methods that return a promise will throw an `Error` instance in the standard promise way.

### `initiate()`
Returns `Promise`.

Function that must be used to initiate the storage. The function internally fetches the `tenant` and retrieves the security token which is needed for making the requests for the FIWARE Object Storage API.

```javascript
storage.initiate()
    .then(() => {
        // initiated the instance succesfully
    })
    .catch((err) => {
        // returns Error instance
    });
```

> If runned again, the function will just refresh the authentication token. Can be used as a reauthentification mechanism. **Currently there isn't a automatic token fetch for reauthentification when expired.**

### `setActiveContainer(containerName)`
- `containerName`: String

Returns `undefined`.

Helper function that changes the active container for the storage instance. Used in case you need to change the container name so that you won't need to pass in the the `containerName` property in methods that require it

> The other container your setting active must be on the same FIWARE region. If it isn't just create a new storage instance.

```javascript
const config = {
  ...
  container: 'my-container'
};

const storage = fiwareObjectStorage(config);

console.log(storage.getActiveContainer());
// > 'my-container'

storage.setActiveContainer('test-container');

console.log(storage.getActiveContainer());
// > 'test-container'
```

### `getActiveContainer()`
Returns `String`.

Helper function that get's the name of active container for the current storage instance.

```javascript
const config = {
  ...
  container: 'my-container'
};

const storage = fiwareObjectStorage(config);

console.log(storage.getActiveContainer());
// > 'my-container'
```

### `lookupTenant()`
Returns `Promise`.

Helper function for identifying the tenant for the region.

> As tenants are static per Object Storage instance, once find out the tenant ID you can pass it in through the config to reduce initiation time.

```javascript
storage.lookupTenant()
    // Returns a string id for the tenant
    .then((tenantID) => console.log(tenantID);
    // > '336c88499c...'
    .catch((err) => {
        // returns Error instance
    });
```

### `getContainerList()`
Returns `Promise`.

Retrieves an array of containers that are available for the user *in the specific region* (don't qoute me on this). Returns an empty array if no containers available.

```javascript
storage.getContainerList()
    .then((containers) => console.log(containers))
    // > ['test-container', ...]
    .catch(err) => {
        // returns Error instance
    });
```

### `createContainer(containerName, [setActive = false])`
- `containerName` : String
- `[setActive]` : Boolean - Default `false`

Returns `Promise`.

Create a new container in the config specified region. And if specified sets as the active Container

```javascript
storage.createContainer('new-container')
    .then(() => {
        // container created
    })
    .catch((err) => {
        // returns Error instance
    });
```

### `listContainer([containerName])`
- `[containerName]` : String - Defaults top the active storage instance container

Returns `Promise`.

Retrieves an array of objects names that are in the container. If there are no objects present returns an empty array.

```javascript
storage.listContainer('new-container')
    .then((objects) => console.log(objects))
    // > ['cat-photo.jpg', 'test.json', ...]
    .catch(err) => {
        // returns Error instance
    });
```

### `deleteContainer(containerName)`
- `containerName` : String

Returns `Promise`.

Finds and deletes a container in the config specified region.

```javascript
storage.deleteContainer('new-container')
    .then(() => {
        // container deleted
    })
    .catch((err) => {
        // returns Error instance
    });
```

### `putObject(objectName, objectMimetype, objectContents, [objectMetadata = {}], [containerName])`
- `objectName` : String - Unique object name
- `objectMimetype` : String - MIME Type for the object you are trying to upload
- `objectContents` : [Buffer](https://nodejs.org/api/buffer.html#buffer_new_buffer_str_encoding)
- `[objectMetadata]` : Object - An object of additional metadata for the file. Default `{}`
- `[containerName]` : String - Defaults top the active storage instance container

Returns `Promise`.

Upload a file object to a container.

> Make sure that `objectName` is only the filename and extension without the path, unless if thats what you want.
> Filename can be found by using `path.basename('/path/to/cat-photo.jpg')`

> **Object names are unique to the container, if a object with the name already exists `putObject` will override the object!**
>
> **Object contents must be a Buffer class instance** which can be taken directly from reading a file or by creating a buffer from string [`new Buffer(str[, encoding])`](https://nodejs.org/api/buffer.html#buffer_new_buffer_str_encoding). If trying to upload a object or array or number you need to convert it to a string. Done by `JSON.stringify(<variable>)`.

**Example uploading a image file.**

```javascript
// 3rd party libary for getting MIME type
// Ref: https://www.npmjs.com/package/mime
const mime = require('mime');

/**
 * Helper function that wrapps fs.readFile into a promise
 * @param {String} File path
 * @return {Promise}
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

const objectName = 'cat-photo.jpg';
const objectPath = `/path/to/object/${objectName}`;
const objectMimetype = mime.lookup(objectPath);

readFilePromise(objectPath)
    .then((objectContents) => storage.putObject(objectName, objectMimetype, objectContents))
    .then(() => {
        // Object has been uploaded
    })
    .catch((err) => {
        // returns Error instance
    });
```

**Example uploading a JS object.**

```javascript
const objectName = 'example.json';
const objectMimetype = 'application/json';

let objectContents = {
    name: "John",
    surname: "Rambo"
};

// stringify the object
// Note: good to run through stringify even if is already a string
objectContents = JSON.stringify(objectContents);

// create a Buffer instane from a string
objectContents = new Buffer(objectContents);

storage.putObject(objectName, objectMimetype, objectContents))
    .then(() => {
        // Object has been uploaded
    })
    .catch((err) => {
        // returns Error instance
    });
```


### `getObject(objectName, [containerName])`
- `objectName` : String
- `[containerName]` : String - Defaults top the active storage instance container

Returns `Promise` that returns a object on successful response. The response object will contain:

- `mimeType`: String - MIMEType corresponding to the file
- `metadata`: Object - Additional file metadata which where set during uploading
- `value`: Buffer - Buffer class instance

**Example response of an image**

```javascript
{
    mimeType: 'image/png',
    // Note: metadata is user generated!
    metadata: {
        width: 640,
        height: 320,
        // ...
    },
    value: <Buffer 89 50 4e 47 0d 0a 1a 0a 00 00 00 0d 49 48 44 52 00 00 00 88 00 00 00 20 08 06 00 00 00 c9 f5 30 d1 00 00 0a a8 69 43 43 50 49 43 43 20 50 72 6f 66 69 ... >
}
```

Fetches a object from the container, object data is returned as a Buffer instance. Examples below show ways how to handle the buffer.

**Example getting and saving object to file**

```javascript
const path = require('path');

storage.getObject('cat-photo.jpg')
    .then((res) => new Promise((resolve, reject) => {
        // if needed response may hold an additional metadata object
        // if specified during object upload
        console.log(res.metadata);

        // save the object to file
        const filename = path.join(__dirname, 'downloads', 'cat-photo.jpg');
        fs.writeFile(filename, res.value, function (err, written) {
            return err ? reject(err) : resolve();
        });
    }))
    .catch((err) => {
        // returns Error instance
    });
```

**Example getting and using an JSON object**

```javascript
const path = require('path');

storage.getObject('people.json')
    .then((res) => new Promise((resolve, reject) => {
        // first convert the buffer to string
        let resObj = res.value.toString('utf-8');

        // conver the string to values
        resObj = JSON.parse(resObj);

        console.log(resObj);
        // > [{name: 'John', surname: 'Rambo'}, ...]
    }))
    .catch((err) => {
        // returns Error instance
    });
```

### `deleteObject(objectName, [containerName])`
- `objectName` : String
- `[containerName]` : String - Defaults to the active storage instance container

Returns `Promise`.

Deletes a object from the specified or instance active container.

> **To delete a container it must be empty** else will recieve an Error.

```javascript
storage. deleteObject('cat-picture.jpg', 'new-container')
    .then(() => {
        // object deleted
    })
    .catch((err) => {
        // returns Error instance
    });
```

## Testing
Although there aren't any unit tests written, it is possible to do a system test for testing out the functionality of the module as following:

```bash
# clone the repo
cd path/to/clone/in
git clone https://github.com/renarsvilnis/fiware-object-storage-ge.git

# install the dependencies
cd fiware-object-storage-ge
npm install

# Run the test - for it to work you need to supply the test with the below
# listed config entries
CONTAINER=<your-container-name> USER=<fiware-account-email> PASSWORD=<fiware-account-password> REGION=<object-storage-region> npm run test
# when developing it might be usefull to nodemon on top that reruns the tests
# on file modification
CONTAINER=... npm run test:nodemon
```

## Contributing

Feel free to fork or add issues/pull-requests if something changes in the API schema or authentification process.

These are the things that might need some work on:

- [x] Add missing documenatation
- [ ] Automatic token reauthentification
- [ ] Add `initiateSync` method, either with [`deasync`](https://github.com/abbr/deasync) or [`sync`](https://www.npmjs.com/package/sync) or [`node-sync`](https://github.com/ybogdanov/node-sync).
- [x] `config.tenant` implementation
- [ ] Write tests (*Input tests files are under tests/input*)
- [ ] Add check if instance is initiated before executing methods
- [ ] Create more readable errors
- [ ] Add option to clear force delete container, deletes all objects in it and then deletes the container itself
- [ ] Investigate why `listContainer` and `getContainerList` returns text response with the objectnames, instead of a json response with more detailed info as requests that fetch storage container info on `cloud.lab.fiware.org`

## License

License under MIT.
