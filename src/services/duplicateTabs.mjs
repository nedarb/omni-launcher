export default async function getDupes(tabs) {
  const currentTabs = tabs ?? await browser.tabs.query({});

  // check for duplicates
  const urlToTabsMap = currentTabs.reduce((map, tab)=> {
    const existing = map.get(tab.url) || [];
    map.set(tab.url, [...existing, tab]);
    return map;
  }, new Map());
  const duplicates = Array.from(urlToTabsMap.entries()).filter(([,tabs])=>tabs.length>1);
  return new Map(duplicates);
}