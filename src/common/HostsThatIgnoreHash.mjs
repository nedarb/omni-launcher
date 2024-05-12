import StorageCache from './PersistentStoreCache.mjs';

const key = 'hostsWithoutHash';
const storage = new StorageCache({ [key]: ['docs.google.com', '.quip.com']});

const facade = {
  async add(host) {
    return storage.set(key, [...await this.getHosts(), host]);
  },
  async update(index, host){
    const current =[... await this.getHosts()];
    current[index] = host;
    await storage.set(key, current);
  },
  async remove(index) {
    const current = await this.getHosts();
    const next = [...current];
    next.splice(index,1);
    await storage.set(key, next);

    return next;
  },
  /**
   * @returns {Promise<string[]>}
   */
  async getHosts() {
    return (await storage.get(key)) ?? [];
  }
};

/**
 * @typedef {any} T
 * @param {Array<T>} collection
 * @param {keyof T} urlKey
 * @returns {Promise<Map<string, Array<T>>>}
 */
export async function getGroupedByUrl(collection, urlKey) {
  const hosts = await facade.getHosts();

  return collection.reduce((map, item)=> {
    const url = item[urlKey];
    const urlObj = url ? new URL(url) : null;
    const shouldIgnoreHash = !!hosts.find(host=>urlObj.host.endsWith(host));
    const key = shouldIgnoreHash ? urlObj.origin + urlObj.pathname : url;
    const existing = map.get(key) || [];
    map.set(key, [...existing, item]);
    return map;
  }, new Map());
}

/**
 * @param {Array<T>} collection
 * @param {keyof T} urlKey
 * @returns {Promise<Array<T>>}
 */
export async function getOnePerUrl(collection, urlKey) {
  const hosts = await facade.getHosts();

  const set = new Set();
  const result = [];
  for (const item of collection) {
    const url = item[urlKey];
    const urlObj = url ? new URL(url) : null;
    const shouldIgnoreHash = !!hosts.find(host=>urlObj.host.endsWith(host));
    const key = shouldIgnoreHash ? urlObj.origin + urlObj.pathname : url;
    if (!set.has(key)) {
      result.push(item);
    }
    set.add(key);
  }
  return result;
}

export default facade;
