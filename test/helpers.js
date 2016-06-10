'use strict';

const fs = require('fs');
import uuid from 'node-uuid';
// const path = require('path');
// const mime = require('mime');

import FiwareStorage from '../lib/index';

/**
 * [readFilePromise description]
 * @param  {string} file
 * @return {Buffer}      [description]
 */
export function readFilePromise (file) {
  return new Promise((resolve, reject) => {
    fs.readFile(file, (err, buffer) => err ? reject(err) : resolve(buffer));
  });
}

/**
 * fs.writeFile promise wrapper
 */
export function writeFilePromise (filepath, filecontents) {
  return new Promise((resolve, reject) => {
    fs.writeFile(filepath, filecontents, (err, written) => err ? reject(err) : resolve());
  });
}

/**
 * Helper class for managing containers created during testing
 * @type {Object}
 */
export class TempContainerManager {
  constructor () {
    /**
     * Temporary containers
     * @type {Object[Array]}
     */
    this.containers = [];
  }

  /**
   * Generate unique container name
   * @return {string}
   */
  generateName () {
    return uuid.v4();
  }

  /**
   * Create a container name with a given config and save
   * @param  {Object} config Config for creating storage isntance
   * @return {string} Unique container name
   */
  create (config) {
    const name = this.generateName();
    this.push({name, config});
    return name;
  }

  /**
   * Push new container into the stack
   * @param  {Object} container
   * @return {undefined}
   */
  push (container) {
    this.containers.push(container);
  }

  /**
   * Get all containers
   * @return {Array}
   */
  getAll () {
    return this.containers;
  }

  /**
   * Destroy given container
   * @param  {string} {name
   * @param  {Object} config}
   * @return {Promise}
   */
  destroy ({name, config}) {
    const storage = new FiwareStorage(config);

    return storage.initiate()
      .then(() => storage.deleteContainer(name, true));
  }

  /**
   * Destroy all containers
   * Note: it always resolves!
   * @return {Promise}
   */
  destroyAll () {
    const containers = this.getAll();

    return Promise.all(containers.map((container) => {
      return this.destroy(container)
        .catch(() => Promise.resolve());
    }));
  }
}
