/// <reference path="../global.d.ts" />
import "../webextension-polyfill.js";

const StorageName = "customActions";

export async function getCustomActions() {
  const result = await browser.storage.sync.get(StorageName);
  return result[StorageName] || [];
}

export async function addCustomAction(action) {
  const existing = await getCustomActions();
  existing.push(action);
  await browser.storage.sync.set({ [StorageName]: existing });
  return existing;
}

export async function upsertCustomAction(action) {
  const existing = await getCustomActions();
  if (!existing.find((a) => a.url === action.url)) {
    return await addCustomAction(action);
  }
  return existing;
}
