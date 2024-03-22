import storage from '../common/HostsThatIgnoreHash.mjs';

export default async function getDupes(tabs) {
  const currentTabs = tabs ?? await browser.tabs.query({});
  const hosts = await storage.getHosts();

  // check for duplicates
  const urlToTabsMap = currentTabs.reduce((map, tab)=> {
    const url = tab.url;
    const urlObj = url ? new URL(url) : null;
    const shouldIgnoreHash = !!hosts.find(host=>urlObj.host.endsWith(host));
    const key = shouldIgnoreHash ? urlObj.origin + urlObj.pathname : url;
    const existing = map.get(key) || [];
    map.set(key, [...existing, tab]);
    return map;
  }, new Map());
  const duplicates = Array.from(urlToTabsMap.entries()).filter(([,tabs])=>tabs.length>1);
  return new Map(duplicates);
}