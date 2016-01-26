# fiware-object-storage-ge

> A promise based Node.js module for read/write access to the FIWARE Object Storage GE

Started as a fork of [arvidkahl/fiware-object-storage](https://github.com/arvidkahl/fiware-object-storage) repository ended up as a ground up rewrite referencing the [FIWARE python example](https://forge.fiware.org/plugins/mediawiki/wiki/fiware/index.php/Object_Storage_-_User_and_Programmers_Guide#Example_Python).

## Installation

> Requires `v5.*.*` Node.js

``` bash
npm install --save fiware-object-storage-ge
```

## Usage

```javascript
'use script';

const fiwareObjectStorage = require('fiware-object-storage-ge');

const config = {
  // IP of the Auth Services, no need to pass it explicitly 99%
  // By defaults "cloud.lab.fi-ware.org"
  auth: 'cloud.lab.fi-ware.org'
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

```javascript
storage.initiate()
    .then(() => {
        // authenticated succesfully
    })
    .catch((err) => {
        console.err(err);
    });
```

### `initiate()`
Returns `Promise`.

Function that must be used to initiate the storage. The function internally fetches the `tenant` and retrieves the security token which is needed for making the requests for the FIWARE Object Storage API.

```javascript
storage.init()
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

> As tenants are static per Object Storage instance, once you query the tenant ID you can pass it to the config to reduce initiate time. **NOT YET IMPLEMENTED**

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

TODO: documentation

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

TODO: documentation

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

### `putObject(objectName, objectMimetype, objectContents, [containerName])`
- `objectName` : String - Unique object name
- `objectMimetype` : String - MIME Type for the object you are trying to upload
- `objectContents` : Buffer
- `[containerName]` : String - Defaults top the active storage instance container

Returns `Promise`.

> Make sure that `objectName` is only the filename and extension without the path, unless if thats what you want.
> Filename can be found by using `path.basename('/path/to/cat-photo.jpg')`

> **If a object with the name already exists `putObject` will override it!**

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

### `getObject(objectName, [containerName])`
- `objectName` : String
- `[containerName]` : String - Defaults top the active storage instance container

Returns `Promise`.

TODO: documentation

### `deleteObject(objectName, [containerName])`
- `objectName` : String
- `[containerName]` : String - Defaults to the active storage instance container

Returns `Promise`.

Deletes a object from the specified or instance active container.

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

Work needed on:

- [ ] Add missing documenatation
- [ ] Automatic token reauthentification
- [ ] Add `initiateSync` method, either with [`deasync`](https://github.com/abbr/deasync) or [`sync`](https://www.npmjs.com/package/sync) or [`node-sync`](https://github.com/ybogdanov/node-sync).
- [ ] `config.tenant` implementation
- [ ] Tests (*Input tests files are under tests/input*)
- [ ] Add check if instance is initiated before executing methods
- [ ] Create more readable errors

## License

License under MIT.
