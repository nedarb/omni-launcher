/**
 * @typedef { import("../global").Action } Action
 */
import '../lib/webextension-polyfill.js';

const StorageName = 'customActions';
const CustomActionPrefix = 'custom-action:';

// @ts-ignore
const uuid = () => crypto.randomUUID();

const GetStorageKeyForId = id => `${CustomActionPrefix}${id}`;

const LegacyActionsMigration = async (items, removeFn, setFn)=>{
  const {customActions} = items;
  if (customActions) {
    const result = {...items};
    delete result.customActions;
    await removeFn('customActions');

    // split up custom actions
    console.log('customActions=', Object.entries(customActions));
    for(const action of customActions) {
      const {id} = action;
      const key = GetStorageKeyForId(id);
      result[key] = action;
      await setFn({[key]: action});
    }
    return result;
  }
  return items;
};

class StorageCache {
  #cache = {};
  #initPromise;
  constructor() {
    this.#initPromise = browser.storage.sync.get(null)
      .then(items=>LegacyActionsMigration(items, browser.storage.sync.remove, browser.storage.sync.set))
      .then(items => {
        for (const [key, value] of Object.entries(items)) {
          this.#cache[key] = value;
        }
        console.log('final items', this.#cache);
      });
  }

  async get(key) {
    await this.#initPromise;
    return this.#cache[key];
  }
  async set(key, value) {
    await this.#initPromise;
    await browser.storage.sync.set({[key]: value});
    this.#cache[key] = value;
  }
  async remove(key) {
    await this.#initPromise;
    delete this.#cache[key];
    await browser.storage.sync.remove(key);
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

const storageCache = new StorageCache();

async function saveActions(actions) {
  await browser.storage.sync.set({ [StorageName]: actions });
  return actions;
}

export async function getCustomActionForOpenXmlUrl(openSearchXmlUrl) {
  const existing = await getCustomActions();
  return existing.find(
    (action) => action.openSearchXmlUrl === openSearchXmlUrl
  );
}

export async function getCustomActions() {
  const map = await storageCache.getAll(CustomActionPrefix);
  return Object.values(map);
}

export async function addCustomAction(action) {
  const existing = await getCustomActions();
  if (!action.id) {
    action.id = uuid();
  }
  existing.push(action);
  return saveActions(existing);
}

export async function upsertCustomAction(action) {
  if (!action.id) {
    action.id = uuid();
  }
  if (!action.desc) {
    action.desc = action.title;
  }

  const storageKey = GetStorageKeyForId(action.id);
  const existing = storageCache.get(storageKey);

  await storageCache.set(storageKey, action);

  return await getCustomActions();
}

export async function deleteAction(action) {
  const storageKey = GetStorageKeyForId(action.id);
  await storageCache.remove(storageKey);
}
