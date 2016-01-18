'use strict';

/**
 * FIWARE Object Storage GE read/write access
 * originally created by Arvid Kahl
 * You will need your FIWARE account credentials for this module to work.
 * new Object Storage API @FIWARE servers leads to problems, which are now fixed (Finn Malte Hinrichsen, PHAROS GmbH)
 * You will also need the SWIFT URL of your tenant, get it by debugging the second auth call. Example: For lannion2 it is api2.xifi.imaginlab.fr what should be in "url".
 * check the AUTH part at the connection beginning to use another tenant (debug the call and you'll see all the tenants)
 * todo:
 * - dynamical URL gathering from AUTH request (where you get the catalogue with all the tenants)
 * - option: using a fixed, provided tenant ID / name
 * - cleaning debug at stuff
 */

 // Code for reference: https://forge.fiware.org/plugins/mediawiki/wiki/fiware/index.php/Object_Storage_-_User_and_Programmers_Guide

const needle = require('needle');
// const btoa = require('btoa');
// const atob = require('atob');
const qs = require('qs');
const debug = require('debug')('fiware-object-storage');

let auth = null;
let container = null;
let currentAuthToken = null;
let currentFullAuthToken = null;
let currentTenant = null;
let password = null;
let url = null;
let user = null;

const ERR_NO_TOKEN = 'No Auth Token available';

const getFile = function (name) {
  return new Promise((resolve, reject) => {
    // check if has got token from connecting to database
    if (!currentFullAuthToken) {
      debug(ERR_NO_TOKEN);
      reject(new Error(ERR_NO_TOKEN));
      return;
    }

    debug(`Getting File ${name} from ${container}.`);

    const reqUrl = `http://${url}:8080/v1/AUTH_${currentTenant}/${container}/${name}`;
    const reqOpts = {
      headers: {
        'X-Auth-Token': currentFullAuthToken,
        // 'x-cdmi-specification-version': '1.0.1'
      }
    };

    // make the request
    needle.get(reqUrl, reqOpts, function (err, res) {
      if (err || res.statusCode !== 200) {
        debug(err.message);
        reject(err);
        return;
      }

      debug(`Got File Contents ${name} from ${container}.`);

      // NOTE: might break!
      const parsedBody = qs.parse(res.body.toString());
      return resolve({
        meta: JSON.parse(parsedBody.meta),
        mimetype: parsedBody.mimetype,
        value: parsedBody.value
      });
    });
  });
};

const putFile = function (name, data, meta) {
  return new Promise((reject, resolve) => {
    // check if has got token from connecting to database
    if (!currentFullAuthToken) {
      debug(ERR_NO_TOKEN);
      reject(new Error(ERR_NO_TOKEN));
      return;
    }

    debug(`Uploading File ${name} to ${container}.`);

    // TODO: stringify and try-catch data
    let putData = data;

    const reqUrl = `http://${url}:8080/v1/AUTH_${currentTenant}/${container}/${name}`;
    const reqData = {
      mimetype: meta.mimetype,
      meta: JSON.stringify(meta),
      value: putData
    };
    const reqOpts = {
      headers: {
        'X-Auth-Token': currentFullAuthToken,
        'content-type': 'application/cdmi-object',
        'accept': 'application/cdmi-object',
        'x-cdmi-specification-version': '1.0.1'
      }
    };

    needle.put(reqUrl, reqData, reqOpts, function (err, res) {
      if (err) {
        const msg = `Error uploading file ${name} to ${container}. ${err.message}`;

        debug(msg);
        reject(new Error(msg));
        return;
      }

      debug(`Uploaded File ${name} to ${container}.`);

      // NOTE: not sure why need to check if null
      resolve(res !== null ? res.body : undefined);
    });
  });
};

const getFileList = function () {
  return new Promise((resolve, reject) => {
    // check if has got token from connecting to database
    if (!currentFullAuthToken) {
      debug(ERR_NO_TOKEN);
      reject(new Error(ERR_NO_TOKEN));
      return;
    }

    debug(`Listing files for current tenant: ${currentTenant}`);

    const reqUrl = `http://${url}:8080/v1/AUTH_${currentTenant}/${container}/`;
    const reqOpts = {
      headers: {
        'X-Auth-Token': currentFullAuthToken,
        'content-type': 'application/cdmi-container',
        'accept': '*/*',
        'x-cdmi-specification-version': '1.0.1,1.0.2,1.5,2.0'
      }
    };

    needle.get(reqUrl, reqOpts, function (err, res) {
      if (err) {
        const msg = `Error getting file list. ${err.message}`;
        debug(msg);
        reject(new Error(msg));
        return;
      }




      
      var i, item, j, len, len1, parsedListData, ref, ref1, ref2;

      parsedListData = {
        list: [],
        container: container
      };
      console.log(ref);
      ref1 = res != null ? (ref = res.body) != null ? ref.split("\n") : void 0 : void 0;
      // ref1 = res.body;
      console.log("-------------------- ref");
      console.log(ref);
      console.log("-------------------- stringify(ref1)");
      console.log(JSON.stringify(ref));
      console.log("-------------------- parsedListData");
      console.log(parsedListData);
      console.log("--------------------");
      for (i = 0, len = ref1.length; i < len; i++) {
        item = ref1[i];
        if (item.trim()) {
          parsedListData.list.push(item.trim());
        }
      }
      deferred.resolve(parsedListData);
      debug("Files in Container [" + chalk.white(container) + "]:");
      ref2 = parsedListData.list;
      for (j = 0, len1 = ref2.length; j < len1; j++) {
        item = ref2[j];
        debug(" - " + item, "success");
      }
      if (parsedListData.list.length === 0) {
        return debug("No Files in this Container", "info");
      }
    });
  });
};

const connectToObjectStorage = function (config, callback) {
  if (callback == null) {
    callback = function() {};
  }
  auth = config.auth, url = config.url, user = config.user, password = config.password, container = config.container;
  debug("Connecting to FIWARE Object Storage");
  return needle.request("post", "http://" + auth + ":4730/v2.0/tokens", {
    auth: {
      passwordCredentials: {
        username: user,
        password: password
      }
    }
  }, {
    json: true
  }, function(err, authResponse) {
    var ref, ref1, ref2, ref3, ref4, ref5, ref6;
    if (err) {
      return debug("Error retrieving Auth Token. " + err);
    } else {
      if ((ref = authResponse.body) != null ? (ref1 = ref.access) != null ? ref1.token : void 0 : void 0) {
        debug(chalk.green("Received Auth Token") + (". Expires " + authResponse.body.access.token.expires));
        currentAuthToken = (ref2 = authResponse.body) != null ? (ref3 = ref2.access) != null ? ref3.token.id : void 0 : void 0;
      }
      if ((ref4 = authResponse.body) != null ? (ref5 = ref4.access) != null ? (ref6 = ref5.user) != null ? ref6.name : void 0 : void 0 : void 0) {
        debug("Connected as " + chalk.green("" + authResponse.body.access.user.name));
      }
      return needle.get("http://" + auth + ":4730/v2.0/tenants", {
        headers: {
          "x-auth-token": currentAuthToken
        },
        json: true
      }, function(err, tenantResponse) {
        var body, e;
        if (err) {
          debug("Error retrieving Tenants. " + err);
          return callback();
        } else {
          try {
            //console.log('tenantresponse');
            //console.log(tenantResponse);
            //console.log(tenantResponse.body);
            //body = JSON.parse(tenantResponse != null ? tenantResponse.body : void 0);
            //t1 = JSON.parse(tenantResponse.body.tenants[0]);
            //console.log(tenantResponse.body.tenants[0].idÇ);
            t1_name = tenantResponse.body.tenants[0].name;
            //console.log("=========");
            //console.log(t1_name);
            t1_id = tenantResponse.body.tenants[0].id;  

          } catch (_error) {
            e = _error;
            console.log(e);
            body = {};
          }
          if (t1_id === false) {
            debug("No tenants available.");
            return callback();
          } else {
            //console.log(tenantResponse.body.tenants);
            //body = JSON.parse(tenantResponse.body);
            debug("Received Tenants.");
            
            //debug("Selecting Tenant: [" + chalk.green("" + body.tenants[0].name) + ("] " + body.tenants[0].id + " (enabled:") + chalk.green("" + body.tenants[0].enabled) + ")");
            //debug("Selecting Tenant: [" + chalk.green("" + t1.name) + ("] " + t1.id + " (enabled:") + chalk.green("" + t1.enabled) + ")");
            
            debug("Selecting Tenant: " + t1_id );
            currentTenant = t1_id;
            return needle.request("post", "http://" + auth + ":4730/v2.0/tokens", {
              auth: {
                passwordCredentials: {
                  username: user,
                  password: password
                },
                tenantId: currentTenant
              }
            }, {
              json: true
            }, function(err, fullAuthResponse) {

           //   console.log(fullAuthResponse);
              var ref10, ref11, ref7, ref8, ref9;
              if (err) {
                debug("Error receiving Full Token. " + err);
                return callback();
              } else {
             //     console.log(fullAuthResponse.body.access.token.id)
                  currentFullAuthToken = fullAuthResponse.body.access.token.id;
                  return callback();
                
                /*

                // old code
                if ((ref7 = fullAuthResponse.body) != null ? (ref8 = ref7.access) != null ? ref8.token : void 0 : void 0) {
                  debug("Received Full Token. Expires " + chalk.green("" + ((ref9 = fullAuthResponse.body) != null ? (ref10 = ref9.access) != null ? (ref11 = ref10.token) != null ? ref11.expires : void 0 : void 0 : void 0)), "success");
                  currentFullAuthToken = fullAuthResponse.body.access.token.id;
                  return callback();
                } else {
                  callback();
                  return debug("No Full Token available.");
                }
                */
              }
            });
          }
        }
      });
    }
  });
};

module.exports = function (config) {
  auth = config.auth;
  url = config.url;
  user = config.user;
  password = config.password;
  container = config.container;

  return {
    connectToObjectStorage: function (callback) {
      return connectToObjectStorage(config, callback);
    },
    getFileList: getFileList,
    putFile: putFile,
    getFile: getFile
  };
};
