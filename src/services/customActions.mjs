/**
 * @typedef { import("../@types/global.js").Action } Action
 */
import '../lib/webextension-polyfill.js';
import StorageCache from '../common/PersistentStoreCache.mjs';

const CustomActionPrefix = 'custom-action:';

// @ts-ignore
const uuid = () => crypto.randomUUID();

const GetStorageKeyForId = id => `${CustomActionPrefix}${id}`;

const LegacyActionsMigration = async (items)=>{
  const {customActions} = items;
  if (customActions) {
    const result = {...items};
    delete result.customActions;

    // split up custom actions
    console.log('customActions=', Object.entries(customActions));
    for(const action of customActions) {
      const {id} = action;
      const key = GetStorageKeyForId(id);
      result[key] = action;
    }
    return result;
  }
  return items;
};

const RemoveDuplicates = async (map, removeFn) =>{
  const result = {...map};
  const existingSearchEnginesSet = new Set();
  for (const [key, value] of Object.entries(map)) {
    if (key.startsWith(CustomActionPrefix)) {
      const {url} = value;
      if (existingSearchEnginesSet.has(url)) {
        console.warn(`Found duplicate search engine for ${url}`);
        await removeFn(key);
        delete result[key];
      }
      existingSearchEnginesSet.add(url);
    }
  }
  return result;
};

const storageCache = new StorageCache(null, LegacyActionsMigration, RemoveDuplicates);

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

export async function upsertCustomAction(action) {
  if (!action.id) {
    action.id = uuid();
  }
  if (!action.desc) {
    action.desc = action.title;
  }

  const storageKey = GetStorageKeyForId(action.id);

  await storageCache.set(storageKey, action);

  return await getCustomActions();
}

export async function deleteAction(action) {
  const storageKey = GetStorageKeyForId(action.id);
  await storageCache.remove(storageKey);
}
