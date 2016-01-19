# fiware-object-storage

> A promise based Node.js module for read/write access to the FIWARE Object Storage GE

Started as a fork of [arvidkahl/fiware-object-storage](https://github.com/arvidkahl/fiware-object-storage) repository ended up as a ground up rewrite with additional functionality from the [FIWARE python example](https://forge.fiware.org/plugins/mediawiki/wiki/fiware/index.php/Object_Storage_-_User_and_Programmers_Guide#Example_Python).

## Installation

``` bash
npm install --save fiware-object-storage
```

## Usage

Include the `fiware-object-storage` module and initialize it with a configuration object:

```javascript
const FiwareObjectStorage = require('fiware-object-storage');

const config = {
  // IP of the Auth Services, likely "cloud.lab.fi-ware.org"
  auth: 'FIWARE_AUTH_URL'
  // Default container you want to work with
  container: 'some-container',           
  // Your FIWARE account email
  user: "john.rambo@usa.gov"
  // Your FIWARE account password
  password: "Yourw0rstn1ghtmare"
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

## Methods

### initiate(callback)
Connects to the URLs declared in the config. Then calls the `callback` function

### createContainer(containerName)
- `containerName` String

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

## License
No warranties. It's fiware-related code.

For anything else: MIT.
