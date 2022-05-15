import '../lib/webextension-polyfill.js';

const PathLimit = 1;

let pendingSave = {};
let timeoutId = null;

const getKey = url => `favIcon:${new URL(url).hostname}`;
const getKeys = url => {
  const urlObj = new URL(url);
  const pathParts = urlObj.pathname.split('/').filter(s=>s.length>0)
    .filter((value, index)=> index< PathLimit)
    .reduce((arr, pathPart)=>{
      const last = arr[arr.length-1];
      const next = [last, pathPart].join('/');
      return [...arr, next];
    },[getKey(url)]);
  return pathParts;
};
const isValidUrl = url => url && (url.startsWith('http:') || url.startsWith('https:'));

function doSave() {
  const copy = {...pendingSave};
  pendingSave = {};
  browser.storage.local.set(copy);
  console.log('saved into fav icons cache', copy);
}

export function saveFavIcon(url, favIconUrl) {
  if (url && favIconUrl && isValidUrl(url)) {
    const keys = getKeys(url);
    for (const key of keys) {
      pendingSave[key] = favIconUrl;
    }

    clearTimeout(timeoutId);
    timeoutId = setTimeout(doSave, 500);
  }
}

export async function getFavIcons(urls) {
  const urlToKeys = urls.filter(isValidUrl).map(url => ({url, key: getKey(url), keys: getKeys(url)}));
  const keysToFetch = new Set(urlToKeys.map(({keys}) => keys).flat());
  console.log('keysToFetch', keysToFetch);
  const results = await browser.storage.local.get([...keysToFetch]);
  return Object.fromEntries(
    urlToKeys.map(({url, key, keys}) => {
      for (let i = keys.length-1; i>=0; i--) {
        const key = keys[i];
        if (results[key]){
          return [url, results[key]];
        }
      }
      return [url, results[key]];
    }).filter(([, iconUrl]) => !!iconUrl));
}