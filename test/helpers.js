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

    /**
     * All test containers are prefixed for human readability
     * @type {String}
     */
    this.prefix = 'AUTOMATED-TEST-CONTAINER';
  }

  /**
   * Generate unique container name
   * @return {string}
   */
  generateName () {
    return `${this.prefix}-${uuid.v4()}`;
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

  isTestContainer (name) {
    return name.startsWith(this.prefix);
  }

  /**
   * Destroy given container
   * @param  {string} {name
   * @param  {Object} config}
   * @return {Promise}
   */
  destroy ({name, config}) {
    const storage = new FiwareStorage(config);

    if (!this.isTestContainer(name)) {
      throw new Error('Trying to delete a non test container, that is prohibited');
    }

    return storage.initiate()
      .then(() => storage.deleteContainer(name, true));
  }

  /**
   * Filter out non test containers
   * @param  {Array} containers
   * @return {Array}
   */
  filterTestContainers (containers) {
    return containers.filter((n) => this.isTestContainer(n));
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
