/**
 * @typedef { import("../global").Action } Action
 */
import '../lib/webextension-polyfill.js';

import {
  html,
  render,
  useEffect,
  useState,
} from '../lib/htm-preact-standalone.mjs';

import { RemoveDuplicateTabs } from '../ActionNames.mjs';
import { chain, inverse, bySelector } from '../utils/sorters.mjs';
 

async function getDupes() {
  const tabs = await browser.tabs.query({});
  /** @type {Array<Action>} */
  const result = tabs.map((tab) => ({
    ...tab,
    title: tab.title,
    desc: 'Chrome tab',
    keycheck: false,
    action: 'switch-tab',
    type: 'tab',
  }));

  // check for duplicates
  const urlToTabsMap = result.reduce((map, tab)=> {
    const existing = map.get(tab.url) || [];
    map.set(tab.url, [...existing, tab]);
    return map;
  }, new Map());
  const duplicates = Array.from(urlToTabsMap.entries()).filter(([,tabs])=>tabs.length>1);
  if (duplicates.length>0) {
    const tabsToRemove = duplicates.map(([,tabs])=>tabs.sort(chain(
      inverse(bySelector(t=>t.active)),
      bySelector(t=>t.highlighted),
      bySelector(t=>t.selected),
      bySelector(t=>t.id)
    )))
      .map(tabs=>tabs.slice(1))
      .flat();
    const tabCountToRemove = tabsToRemove.length;
    result.push({type: 'action', action: RemoveDuplicateTabs, title: `Remove ${tabCountToRemove} duplicate tabs`, desc: `Remove ${tabCountToRemove} duplicate tabs`, payload: tabsToRemove.map(t=>t.id)});
  }
  const duplicatedTabs = duplicates.map(([,tabs])=> tabs).flat();
  for(const tab of duplicatedTabs) {
    tab.isDuplicate = true;
  }

  return new Map(duplicates);
}

function DuplicateTab({ url, tabs}) {
  const favIconUrl = tabs[0].favIconUrl;
  const title = tabs[0].title;
  return html`<div class="tab">${title} ${url} <img src="${favIconUrl}"/></div>`;
}

function MyCmp() {
  const [dupes, setDupes] = useState(null);
  useEffect(()=>{
    getDupes().then(setDupes);
  },[]);
  console.log('dupes', dupes?.entries());

  if (dupes?.size>0) {
    return html`<div>duplicates: ${dupes?.size} 
    ${Array.from(dupes.entries()).map(([url, tabs])=>html`<${DuplicateTab} key=${url} url=${url} tabs=${tabs} />`)}
    </div>`;
  }
}
 
const dest = document.getElementById('app');
render(html`<${MyCmp} />`, dest);