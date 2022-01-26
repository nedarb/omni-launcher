/// <reference path="../global.d.ts" />
import "../webextension-polyfill.js";

const StorageName = "customActions";

const uuid = () => crypto.randomUUID();

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
export async function getCustomActions() {
  const result = await browser.storage.sync.get(StorageName);
  const entries = result[StorageName] || [];
  for (const entry of entries) {
    if (!entry.id) {
      entry.id = uuid();
    }
  }
  return entries;
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
  if (!action.shortcut) {
    action.shortcut = new URL(action.url).host;
  }
  if (!action.desc) {
    action.desc = action.title;
  }

  const existingActions = await getCustomActions();
  const existingIndex = existingActions.findIndex((a) => a.id === action.id);
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
