'use strict';

const request = require('superagent');
const co = require('co');
const debug = require('debug')('fiware-object-storage-ge');

const retrieveAuthentificationToken = function (host, username, password) {
  const url = `${host}/${API_VERSION}/tokens`;

  return new Promise((resolve, reject) => {
    debug('Fetching authentification token');

    request
      .post(url)
      .set('Content-Type', 'application/json')
      .send({
        auth: {
          passwordCredentials: {username, password}
        }
      })
      .end(function (err, res) {
        if (err) {
          reject(err);
          return;
        }

        // TODO: check status code

        const token = res.body.access.token.id;
        resolve(token);
      });
  });
};

const retrieveTenant = function (host, token) {
  const url = `${host}/${API_VERSION}/tenants`;

  debug('Fetching tenant');

  return new Promise((resolve, reject) => {
    request
      .get(url)
      .set('X-Auth-Token', token)
      .end(function (err, res) {
        if (err) {
          reject(err);
          return;
        }

        // TODO: check status code

        // Note: same as the phyton example use take the first tenant available
        const tenant = res.body.tenants[0].id;

        resolve(tenant);
      });
  });
};

const retrieveSecurityToken = function (host, tenantID, user, password, region) {
  const url = `${host}/${API_VERSION}/tokens`;

  debug('Fetching security token');

  return new Promise((resolve, reject) => {
    request
      .post(url)
      .set('Content-Type', 'application/json')
      .send({
        auth: {
          tenantId: tenantID,
          passwordCredentials: {
            username: user,
            password
          }
        }
      })
      .end(function (err, res) {
        if (err) {
          reject(err);
          return;
        }

        // TODO: check status code

        debug('Choosing swift endpoint');

        const token = res.body.access.token.id;
        let url;

        // loop available services and find swift
        let services = res.body.access.serviceCatalog;
        for (let i = 0, l = services.length; i < l; i++) {
          let service = services[i];

          if (service.name === 'swift') {
            // find the endpoint for the passed region
            let endpoints = service.endpoints;
            for (let j = 0, m = endpoints.length; j < m; j++) {
              let endpoint = endpoints[j];

              if (endpoint.region === region) {
                url = endpoint.publicURL;
                break;
              }
            }

            break;
          }
        }

        // TODO: check if invalid endpoint

        resolve({token, url});
      });
  });
};

const swiftRequest = function (method, url, headers, body) {
  // debug(`Making a swift ${method} request to ${url}`);

  return new Promise((resolve, reject) => {
    request(method, url)
      .set('Content-Type', 'application/json')
      .set(headers)
      .send(body)
      .end(function (err, res) {
        if (err) {
          reject(err);
          return;
        }

        const validHttpCodes = [200, 201, 202, 204];

        // invalid response
        if (validHttpCodes.indexOf(res.statusCode) < 0) {
          reject(new Error('Error while making request'));
          return;
        }

        // TODO: maybe check by res.headers.content-type header
        // Ref: http://visionmedia.github.io/superagent/#response-text
        resolve(res.text || res.body);
      });
  });
};

/**
 * Fiware Object GE versions
 * @type {String}
 */
const API_VERSION = 'v2.0';

/**
 * Default storage configuration
 * @type {Object}
 */
const DEF_CONFIG = {
  user: null,
  password: null,
  host: 'http://cloud.lab.fiware.org:4730',
  region: 'Spain2',
  container: null,
  tenant: null
};

module.exports = function (config) {
  config = Object.assign({}, DEF_CONFIG, config);

  // TODO: validate if valid config

  const user = config.user;
  const password = config.password;
  const host = config.host;
  const region = config.region;

  let container = config.container;
  let tenant = config.tenant;
  let authData = {};

  return {
    initiate () {
      return this.lookupTenant()
        .then((tenant) => retrieveSecurityToken(host, tenant, user, password, region))
        .then((newAuthData) => {
          authData = newAuthData;
        });
    },

    // #########################################################################
    // Helper methods
    // #########################################################################

    setActiveContainer (containerName) {
      container = containerName;
    },

    getActiveContainer () {
      return container;
    },

    lookupTenant () {
      // as tenats are constant and if have already fetched it, return it
      if (tenant) {
        return Promise.resolve(tenant);
      }

      return retrieveAuthentificationToken(host, user, password)
        .then((token) => {
          return retrieveTenant(host, token);
        })
        .then((newTenant) => {
          tenant = newTenant;
          return newTenant;
        });
    },

    // #########################################################################
    // Container interaction methods
    // #########################################################################

    /**
     * Create a new container
     * @param  {string} containerName
     * @param  {boolean} [setActive=false] Set the newly created container as active
     * @return {Promise}
     */
    createContainer (containerName, setActive) {
      setActive = setActive || false;

      debug('Creating container');

      const url = `${authData.url}/${containerName}`;
      const headers = {'X-Auth-Token': authData.token};
      return swiftRequest('put', url, headers)
        .then(() => {
          if (setActive) {
            debug('Setting created container as active');
            this.setActiveContainer(containerName);
          }
        });
    },

    /**
     * Delete a given container
     * @param  {string} containerName
     * @param  {boolean} [force=false] Used to delete a non-empty container
     * @return {Promise}
     */
    deleteContainer (containerName, force) {
      return co.call(this, function * () {
        /**
         * By default it's impossible to delete non-empty container,
         * by enabling force, it will fetch and delete all objects of the container
         * and then delete the container itself
         */
        force = force || false;

        // delete all existing objects
        if (force) {
          const objects = yield this.listContainer(containerName);
          yield objects.map((objectName) => this.deleteObject(objectName, containerName));
        }

        // delete container
        const url = `${authData.url}/${containerName}`;
        const headers = {'X-Auth-Token': authData.token};
        debug('Deleting container');
        return swiftRequest('delete', url, headers);
      });
    },

    /**
     * List all containers
     * @return {Promise.<Array>}
     */
    getContainerList () {
      const url = `${authData.url}`;
      const headers = {'X-Auth-Token': authData.token};

      debug('Listing available containers');

      return swiftRequest('get', url, headers)
        .then((text) => {
          /**
           * When no containers found it request will respond with an empty body,
           * but due to switftRequest, the response will be converted to an empty object
           */
          if (typeof text === 'string' && text.length) {
            return text.split(/\n/)
              .map((item) => item.trim())
              .filter((item) => !!item);
          }

          return [];
        });
    },

    /**
     * List all items in a container
     * @param  {string} [containerName=container] Defaults to current active container
     * @return {Promise.<Array>}
     */
    listContainer (containerName) {
      containerName = containerName || container;

      const url = `${authData.url}/${containerName}`;
      const headers = {'X-Auth-Token': authData.token};

      debug('Fetching container objects');

      return swiftRequest('get', url, headers)
        .then((text) => {
          /**
           * When the container is empty the request will respond with an empty body,
           * but due to switftRequest, the response will be converted to an empty object
           */
          if (typeof text === 'string' && text.length) {
            return text.split(/\n/)
              .map((item) => item.trim())
              .filter((item) => !!item);
          }

          return [];
        });
    },

    /**
     * Put or override an object in a container
     * @param  {string} objectName          Unique object name
     * @param  {string} objectMimetype      MIME Type for the object you are trying to upload
     * @param  {Buffer} objectContents
     * @param  {Object} [objectMetadata={}] Additional metadata for the object
     * @param  {[type]} containerName
     * @return {Promise}
     */
    putObject (objectName, objectMimetype, objectContents, objectMetadata, containerName) {
      containerName = containerName || container;

      const url = `${authData.url}/${containerName}/${objectName}`;
      const headers = {'X-Auth-Token': authData.token};
      const json = JSON.stringify({
        mimeType: objectMimetype,
        metadata: objectMetadata || {},
        valuetransferencoding: 'base64',
        value: new Buffer(objectContents).toString('base64')
      });

      debug(`Uploading ${objectName} object to ${containerName} storage`);

      return swiftRequest('put', url, headers, json);
    },

    /**
     * Get an object from a container
     * @param  {string} objectName
     * @param  {string} containerName Defaults to current active container
     * @return {Promise.<Object>}
     */
    getObject (objectName, containerName) {
      containerName = containerName || container;

      const url = `${authData.url}/${containerName}/${objectName}`;
      const headers = {'X-Auth-Token': authData.token};

      debug(`Getting ${objectName} object from ${containerName} container`);

      return swiftRequest('get', url, headers)
        // convert the incoming package to json
        .then((obj) => typeof obj !== 'object' ? JSON.parse(obj) : obj)
        /**
         * Creating a new object to remove 'valuetransferencoding' key from
         * the response object
         */
        .then((obj) => ({
          mimeType: obj.mimeType,
          metadata: obj.metadata,
          value: typeof obj.value !== 'undefined'
            ? new Buffer(obj.value, 'base64')
            : obj.value
        }));
    },

    /**
     * Delete an object from a container
     * @param  {string} objectName
     * @param  {string} [containerName=container] Defaults to current active container
     * @return {Promise}
     */
    deleteObject (objectName, containerName) {
      containerName = containerName || container;

      const url = `${authData.url}/${containerName}/${objectName}`;
      const headers = {'X-Auth-Token': authData.token};
      debug(`Removing ${objectName} object from ${containerName} container`);
      return swiftRequest('delete', url, headers);
    }
  };
};
