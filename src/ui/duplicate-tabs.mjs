/**
 * @typedef { import("../global").Action } Action
 */
import '../lib/webextension-polyfill.js';

import {
  html,
  render,
  useCallback,
  useEffect,
  useState,
} from '../lib/htm-preact-standalone.mjs';

import { chain, inverse, bySelector } from '../utils/sorters.mjs';
import getDupes from '../services/duplicateTabs.mjs';

async function closeTabs(...tabIds) {
  console.debug(`Closing ${tabIds.length} tabs`);
  for (const tabId of tabIds) {
    await new Promise(r=>setTimeout(r, 50));
    await browser.tabs.remove(tabId);
  }
}

function AsyncButton({ onClick, children}) {
  const [busy, setBusy] = useState(false);
  const handleClick = useCallback(()=>{
    setBusy(true);
    const result = onClick();
    if (result instanceof Promise) {
      result.finally(()=>setBusy(false));
    }
  }, [onClick]);
  return html`<button disabled=${busy} onClick=${handleClick}>${children}</button>`;
}

function DuplicateTab({ url, tabs, onTabsChanged}) {
  const favIconUrl = tabs[0].favIconUrl;
  const title = (tabs.find(t=>t.title !== t.url) ?? tabs[0]).title;
  const windowCount = new Set(tabs.map(tab=>tab.windowId)).size;

  const tabsToRemove = tabs.sort(chain(
    inverse(bySelector(t=>t.active)),
    bySelector(t=>t.highlighted),
    bySelector(t=>t.selected),
    bySelector(t=>t.id)
  )).slice(1);

  const handleClose = ()=>{
    closeTabs(...tabsToRemove.map(t=>t.id)).then(onTabsChanged);
  };

  return html`<div class="tab card">
  <div class="body">
    <span class="title">${title}</span>
    <span class="url">${url}</span> 
  </div>
  <img src="${favIconUrl}"/>
  <span class="count">
    <span class="text">${tabs.length} in ${windowCount} window${windowCount!== 1 ?'s' :''}</span>
    <${AsyncButton} onClick=${handleClose}>Close<//>
  </span>
  </div>`;
}

function addListenerToAll(handler, ...events) {
  for(const e of events) {
    e.addListener(handler);
  }

  return ()=>{
    for (const e of events) {
      e.removeListener(handler);
    }
  };
}

function Duplicates() {
  const [dupes, setDupes] = useState(null);

  const onTabsChanged = ()=>{
    getDupes().then(setDupes);
  };  
  useEffect(()=>{
    onTabsChanged();

    const unsub = addListenerToAll(onTabsChanged, browser.tabs.onRemoved, browser.tabs.onCreated, browser.tabs.onReplaced, browser.tabs.onUpdated);
    return unsub;
  },[]);

  if (dupes?.size>0) {
    return html`<div>
    ${Array.from(dupes.entries()).map(([url, tabs]) => 
    html`<${DuplicateTab} key=${url} url=${url} tabs=${tabs} onTabsChanged=${onTabsChanged} />`)}
    </div>`;
  }

  return html`<div>No duplicates</div>`;
}
 
const dest = document.getElementById('app');
render(html`<${Duplicates} />`, dest);