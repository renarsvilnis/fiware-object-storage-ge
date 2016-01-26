'use strict';

const debug = require('debug')('fiware-object-storage-ge');
const request = require('superagent');

const lookupTenant = function (host, user, password) {
  return retrieveAuthentificationToken(host, user, password)
    .then((token) => retrieveTenant(host, token));
};

const retrieveAuthentificationToken = function (host, user, password) {
  const url = `${host}/v2.0/tokens`;

  return new Promise((resolve, reject) => {
    debug('Fetching authentification token');

    request
      .post(url)
      .set('Content-Type', 'application/json')
      .send({
        auth: {
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

        const token = res.body.access.token.id;
        resolve(token);
      });
  });
};

const retrieveTenant = function (host, token) {
  const url = `${host}/v2.0/tenants`;

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
  const url = `${host}/v2.0/tokens`;

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

const listContainer = function (securityToken, containerUrl, containerName) {
  const url = `${containerUrl}/${containerName}`;
  const headers = {
    'X-Auth-Token': securityToken
  };

  debug('Fetching container objects');

  return swiftRequest('get', url, headers);
};

const createContainer = function (securityToken, containerUrl, containerName) {
  const url = `${containerUrl}/${containerName}`;
  const headers = {
    'X-Auth-Token': securityToken
  };

  debug('Creating container');

  return swiftRequest('put', url, headers);
};

const deleteContainer = function (securityToken, containerUrl, containerName) {
  const url = `${containerUrl}/${containerName}`;
  const headers = {
    'X-Auth-Token': securityToken
  };

  debug('Deleting container');

  return swiftRequest('delete', url, headers);
};

// Note: Doesn't seem to return any, for now commented out
const getContainerList = function (securityToken, containerUrl) {
  const url = `${containerUrl}`;
  const headers = {
    'X-Auth-Token': securityToken
  };

  debug('Listing available containers');

  return swiftRequest('get', url, headers);
};

const putObject = function (securityToken, containerUrl, containerName, objectName, objectMimetype, objectContents) {
  const url = `${containerUrl}/${containerName}/${objectName}`;
  const headers = {
    'X-Auth-Token': securityToken,
    // Note: this will override swiftRequest content-type header
    'Content-Type': objectMimetype
  };
  const data = objectContents;

  debug(`Uploading ${objectName} object to ${containerName} storage`);

  return swiftRequest('put', url, headers, data);
};

const getObject = function (securityToken, containerUrl, containerName, objectName) {
  const url = `${containerUrl}/${containerName}/${objectName}`;
  const headers = {
    'X-Auth-Token': securityToken
  };

  debug(`Getting ${objectName} object from ${containerName} container`);

  return swiftRequest('get', url, headers);
};

const deleteObject = function (securityToken, containerUrl, containerName, objectName) {
  const url = `${containerUrl}/${containerName}/${objectName}`;
  const headers = {
    'X-Auth-Token': securityToken
  };

  debug(`Removing ${objectName} object from ${containerName} container`);

  return swiftRequest('delete', url, headers);
};

const swiftRequest = function (method, url, headers, body) {
  debug(`Making a swift ${method} request to ${url}`);

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

module.exports = function (config) {
  const user = config.user;
  const password = config.password;
  const host = config.auth || 'cloud.lab.fiware.org:4730';
  let container = config.container;
  const region = config.region || 'Spain2';

  let tenant = config.tenant || null;
  let authData = {};

  return {
    initiate () {
      return this.lookupTenant()
        .then((tenant) => retrieveSecurityToken(host, tenant, user, password, region))
        .then((newAuthData) => {
          authData = newAuthData;
        });
    },

    // ########################################
    // Helper methods
    // ########################################

    setActiveContainer (containerName) {
      container = containerName;
    },

    getActiveContainer () {
      return container;
    },

    lookupTenant () {
      // if already has tenant fetched al
      if (tenant) {
        return Promise.resolve(tenant);
      }

      return lookupTenant(host, user, password)
        .then((newTenant) => {
          tenant = newTenant;
          return newTenant;
        });
    },

    // ########################################
    // Container interaction methods
    // ########################################

    createContainer (containerName) {
      return createContainer(authData.token, authData.url, containerName);
    },

    deleteContainer (containerName) {
      return deleteContainer(authData.token, authData.url, containerName);
    },

    getContainerList () {
      return getContainerList(authData.token, authData.url);
    },

    listContainer (containerName) {
      containerName = containerName || container;
      return listContainer(authData.token, authData.url, containerName);
    },

    putObject (objectName, objectMimetype, objectContents, containerName) {
      containerName = containerName || container;
      return putObject(authData.token, authData.url, containerName, objectName, objectMimetype, objectContents);
    },

    getObject (objectName, containerName) {
      containerName = containerName || container;
      return getObject(authData.token, authData.url, containerName, objectName);
    },

    deleteObject (objectName, containerName) {
      containerName = containerName || container;
      return deleteObject(authData.token, authData.url, containerName, objectName);
    }
  };
};
