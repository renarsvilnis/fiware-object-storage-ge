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
  // TODO
  tenant: '<string>'
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

### initiate()
TODO: documentation

> If runned again, the function will just refresh the authentication token. Can be used as a "reconnect" (reauthentification) mechanism.

>Currently there isn't a automatic token fetch for reauthentification when expired.

### setActiveContainer(containerName)
- `containerName` String

Helper functions that sets the active container to passed in `containerName`. The other container must be on the same FIWARE region. `setActiveContainer` Used in situations where you wan't to switch the container which is used

Returns undefined.

### lookupTenant()
Helper function for identifying the tenant for the region.

TODO: documentation

> As tenants are static per Object Storage instance, once you query the tenant ID you can pass it to the config to reduce initiate time. **NOT IMPLEMENTED YET**

### getContainerList()
TODO: documentation

### createContainer(containerName)
TODO: documentation

### listContainer(containerName)
TODO: documenation

### deleteContainer(containerName)
TODO: documenation

### putFile()
TODO: documenation

### getFile()
TODO: documenation

### deleteFile()
TODO: documenation

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
# when developing it might be usefull to nodemon on top that reruns the test
# file on each file modification
CONTAINER=... npm run test:nodemon
```

## Contributing

Feel free to fork or add issues/pull-requests if something changes in the API schema or authentification process.

Work needed on:
- [ ] Documenation
- [ ] Automatic token reauthentification
- [ ] Tests (*Input tests files are under tests/input*)

## License

License under MIT.
