import '../lib/webextension-polyfill.js';

let pendingSave = {};
let timeoutId = null;

const getKey = url => `favIcon:${new URL(url).hostname}`;
const isValidUrl = url => url && (url.startsWith('http:') || url.startsWith('https:'));

function doSave() {
  const copy = {...pendingSave};
  pendingSave = {};
  browser.storage.local.set(copy);
  console.log('saved', copy);
}


export function saveFavIcon(url, favIconUrl) {
  if (url && favIconUrl && isValidUrl(url)) {
    const key = getKey(url);
    pendingSave[key] = favIconUrl;

    clearTimeout(timeoutId);
    timeoutId = setTimeout(doSave, 500);
  }
}

export async function getFavIcons(urls) {
  const urlToKeys = urls.filter(isValidUrl).map(url => ({url, key: getKey(url)}));
  const keysToFetch = new Set(urlToKeys.map(({key}) => key));
  const results = await browser.storage.local.get([...keysToFetch]);
  console.log(urlToKeys, keysToFetch, results);
  return Object.fromEntries(urlToKeys.filter(({key}) => results[key]).map(({url, key}) =>([url, results[key]])));
}