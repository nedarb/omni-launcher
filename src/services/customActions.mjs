/// <reference path="../global.d.ts" />
import "../webextension-polyfill.js";

const StorageName = "customActions";

const uuid = () => crypto.randomUUID();

function manageConcurrent(implFn) {
  let current;
  return function (...args) {
    if (current) {
      console.log('pre-existing call ongoing');
      return current;
    }

    current = implFn.call(this, ...args);
    if (current instanceof Promise) {
      current.finally(() => current = null);
    }
    return current;
  };
}

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

/**
 * Get all custom actions
 * @returns {Promise<Array<{ id: string; openSearchXmlUrl?: string; }>>}
 */
export async function getCustomActionsImpl() {
  const result = await browser.storage.sync.get(StorageName);
  const entries = result[StorageName] || [];
  let migrated = false;
  const urls = new Set();
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    if (urls.has(entry.url)) {
      console.warn(`Removing duplicate ${entry.url}`, entry);
      entries[i] = null;
      migrated = true;
    } else if (!entry.id) {
      entry.id = uuid();
      migrated = true;
    }
    urls.add(entry.url);
  }
  if (migrated) {
    console.info(`migrated some custom actions.`);
    return await saveActions(entries.filter(Boolean));
  }
  return entries;
}

export const getCustomActions = manageConcurrent(getCustomActionsImpl);

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

  const existingActions = await getCustomActions();
  const existingIndex = existingActions.findIndex((a) => a.id === action.id || a.url === action.url);
  if (existingIndex >= 0) {
    const existing = existingActions[existingIndex];
    // update an existing one
    existingActions[existingIndex] = { ...existing, ...action };
    return saveActions(existingActions);
  }

  return await addCustomAction(action);
}

export async function deleteAction(action) {
  const existingActions = await getCustomActions();
  const existingIndex = existingActions.findIndex((a) => a.id === action.id);
  if (existingIndex >= 0) {
    const newActions = existingActions.filter(
      (_, index) => index !== existingIndex
    );
    return saveActions(newActions);
  }
}
