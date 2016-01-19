'use strict';

/**
 * Storage operations:
 * [x] createContainer
 * [x] listContainer
 * [ ] deleteContainer
 * [ ] putFile
 * [ ] getFile
 * [ ] deleteFile
 */

const debug = require('debug')('fiware-object-storage');
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

        console.log(res.body);
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

  debug('Fetching container files');

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

// const putFile = function (securityToken, containerUrl, containerName, data) {
//   const url = `${containerUrl}/${containerName}`;
//   const headers = {
//     'X-Auth-Token': securityToken
//   }

//   {
//     mimetype: meta.mimetype,
//     meta: JSON.stringify(meta),
//     value: putData
//   }

//   debug('Uploading file to storage');

//   return swiftRequest('put', url, headers, data);
// };

const swiftRequest = function (method, url, headers, body) {
  debug('Making a swift request');

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

        resolve(res.body);
      });
  });
};

module.exports = function (config) {
  const user      = config.user;
  const password  = config.password;
  const host      = config.auth;
  const container = config.container;
  const region    = config.region;

  let tenant = config.tenant || null;
  let authData = {};

  return {
    lookupTenant: function () {
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

    initiate: function () {
      return this.lookupTenant()
        .then((tenant) => retrieveSecurityToken(host, tenant, user, password, region))
        .then((newAuthData) => {
          authData = newAuthData;
          return newAuthData;
        });
    },

    listContainer: function (containerName) {
      containerName = containerName || container;
      return listContainer(authData.token, authData.url, containerName);
    },

    createContainer: function (containerName) {
      containerName = containerName || container;
      return createContainer(authData.token, authData.url, containerName);
    },

    setActiveContainer: function (containerName) {
      container = containerName;
    }
  };
};
