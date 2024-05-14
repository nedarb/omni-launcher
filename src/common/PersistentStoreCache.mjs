import '../lib/webextension-polyfill.js';

const UPDATED_MESSAGE = 'updated';

const isInServiceWorker = 'serviceWorker' in globalThis;

/**
 * @typedef {(values: Record<string, any>, removeFn: (key: string) => void) => Promise<Record<string, any>>} Migrator
 */
export default class StorageCache {
  #cache = {};
  #initPromise;
  #storage = browser.storage.sync;

  /**
   * @param {null | string | string[] | Record<string, any>} keys
   * @param {...Migrator} migrations
   */
  constructor(keys = null, ...migrations) {
    if (isInServiceWorker) {
      browser.runtime.onMessage.addListener(msg=>{
        if (msg === UPDATED_MESSAGE) {
          this.#initPromise = this.#init(keys, migrations);
        }
      });
    }

    this.#initPromise = this.#init(keys, migrations);
  }

  /**
   * @param {null | string | string[] | Record<string, any>} keys
   * @param {Array<Migrator>} migrations
   */
  async #init(keys = null, migrations = null) {
    let values = await this.#storage.get(keys);
    for(const m of migrations) {
      const original = JSON.stringify(values);
      const updated = await m(values, this.#storage.remove);
      const different = JSON.stringify(updated) !== original;
      if (different) {
        this.#storage.set(updated);
        values = updated;
      }
    }

    for (const [key, value] of Object.entries(values)) {
      this.#cache[key] = value;
    }
  }

  async get(key) {
    await this.#initPromise;
    return this.#cache[key];
  }
  async set(key, value) {
    await this.#initPromise;
    await this.#storage.set({[key]: value});
    this.#cache[key] = value;

    if (!isInServiceWorker) {
      browser.runtime.sendMessage(UPDATED_MESSAGE);
    }
  }
  async remove(key) {
    await this.#initPromise;
    delete this.#cache[key];
    await this.#storage.remove(key);

    if (!isInServiceWorker) {
      browser.runtime.sendMessage(UPDATED_MESSAGE);
    }
  }

  async getAll(keyPrefix = '') {
    const result = {};
    await this.#initPromise;
    for (const [key, value] of Object.entries(this.#cache)) {
      if (key.startsWith(keyPrefix)) {
        result[key] = value;
      }
    }

    return result;
  }
}
