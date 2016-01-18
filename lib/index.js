'use strict';

/**
 * [ ] createContainer
 * [ ] listContainer
 * [ ] deleteContainer
 * [ ] putFile
 * [ ] getFile
 * [ ] deleteFile
 */

const debug = require('debug')('fiware-object-storage');
const request = require('superagent');

const retrieveAuthentificationToken = function (host, username, password) {
  const url = `${host}/v2.0/tokens`;

  return new Promise((resolve, reject) => {
    debug('Fetching authentification token');

    request
      .post(url)
      .set('Content-Type', 'application/json')
      .send({
        auth: {
          passwordCredentials: {
            username,
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
      .set('x-auth-token', token)
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

const retrieveSecurityToken = function (host, tenantID, username, password) {
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
            username,
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

        res.body.access.serviceCatalog.forEach((service) => {
          if (service.name === 'swift') {
            // TODO: pas an option to select endpoint
            url = service.endpoints[0].publicURL;
          }
        });

        resolve({token, url});
      });
  });
};

module.exports = function (config) {
  const username = config.username;
  const password = config.password;
  const host = config.auth;

  retrieveAuthentificationToken(host, username, password)
    .then((token) => retrieveTenant(host, token))
    .then((tenant) => retrieveSecurityToken(host, tenant, username, password))
    .then((authData) => {
      
      console.log(authData);
    })
    .catch(console.error);

  // new Promise((resolve, reject) => {

  // });

  // debug(config);
};
