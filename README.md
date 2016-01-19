# fiware-object-storage

> A promise based Node.js module for read/write access to the FIWARE Object Storage GE

Started as a fork of [arvidkahl/fiware-object-storage](https://github.com/arvidkahl/fiware-object-storage) repository ended up as a ground up rewrite referencing the [FIWARE python example](https://forge.fiware.org/plugins/mediawiki/wiki/fiware/index.php/Object_Storage_-_User_and_Programmers_Guide#Example_Python).

## Installation

``` bash
npm install --save fiware-object-storage
```

## Usage

Include the `fiware-object-storage` module and initialize it with a configuration object:

```javascript
'use script';

const FiwareObjectStorage = require('fiware-object-storage');

const config = {
  // IP of the Auth Services, likely "cloud.lab.fi-ware.org"
  auth: 'FIWARE_AUTH_URL'
  // Default container you want to work with, as convenience
  container: 'some-container',           
  // Your FIWARE account email
  user: 'john.rambo@usa.gov',
  // Your FIWARE account password
  password: 'Yourw0rstn1ghtmare',
  // TODO
  region: 'Spain2',
  // TODO
  tenant: '<string>'
};

// Create a new fiware object storage instance and passing the config.
// It allows to have multiple instances.
// Recommended to create a singleton module that exports the instance,
// so that authentication happens only once
const fiwareObjectStorage = FiwareObjectStorage(config);

// Initiate the instance by fetching the authentification tokens and
// tenants.
// Recommended to do it on the launch of the server.
fiwareObjectStorage.initiate()
    .then(() => fiwareObjectStorage.listContainer())
    .then((items) => console.log(items))
    // errors are returned as a Error class instance
    .catch(console.error);
```

This module uses [debug](https://www.npmjs.com/package/debug) for debugging, if you wan't to see what the module is doing under the hood in a case where something isn't working, pass an `DEBUG` enviromental variable when launching your server as following:

```bash
# Debug just the fiware-object-storage
DEBUG=fiware-object-storage node server.js
# Debug everything, for a more detailed explanation reference the debug repository
DEBUG=* node server.js
```

## Methods

### initiate()
TODO
~~Connects to the URLs declared in the config. Then calls the `callback` function~~

If runned again, the function will just refresh the authentication token. Can be used as a "reconnect" (reauthentification) mechanism.

Returns a Promise instance.

### setActiveContainer(containerName)
- `containerName` String

Helper functions that sets the active container to passed in `containerName`. The other container must be on the same FIWARE region. `setActiveContainer` Used in situations where you wan't to switch the container which is used

Returns undefined.

### lookupTenant()
Helper function for identifying the tenant for the region

### createContainer(containerName)
- `containerName` String

Create a new container with the name passed in by `containerName`

Returns a promise.

### listContainer(containerName)
Returns Object of Files

### deleteContainer(containerName)
### putFile()
Uploads file into the container. `name` will be the filename inside the container, `data` must be the file data in base64 encoding. `meta` can be any additional data, will be stringified.




### getFile()
Downloads the file called `name` from the container and returns:

```js 
{
  meta : String
  mimetype: String
  value : base64-encoded data
}
```

### deleteFile()

## Contributing
Feel free to fork or add issues/pull-requests if something changes in the API schema or authentification process.

## License
License under MIT.
