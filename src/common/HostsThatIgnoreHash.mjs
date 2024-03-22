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
    const next = [...current].splice(index,1);
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
export default facade;