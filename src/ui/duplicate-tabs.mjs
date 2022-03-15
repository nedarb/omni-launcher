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
import switchTab from '../actions/switchTab.mjs';
import Footer from '../components/Footer.mjs';

async function closeTabs(...tabIds) {
  console.debug(`Closing ${tabIds.length} tabs`);
  for (const tabId of tabIds) {
    await new Promise(r => setTimeout(r, 50));
    await browser.tabs.remove(tabId);
  }
}

function AsyncButton({ onClick, children }) {
  const [busy, setBusy] = useState(false);
  const handleClick = useCallback(() => {
    setBusy(true);
    const result = onClick();
    if (result instanceof Promise) {
      result.finally(() => setBusy(false));
    }
  }, [onClick]);
  return html`<button disabled=${busy} onClick=${handleClick}>${children}</button>`;
}

function WindowDetails({ windowId, tabs }) {
  const tabIds = tabs.map(t=>t.id);
  const [windowTabs, setWindowTabs] = useState([]);
  useEffect(() => {
    const id = typeof windowId === 'string' ? parseInt(windowId) : windowId;
    browser.windows.get(id, { populate: true }).then(info => {
      setWindowTabs(info.tabs);
    });
  }, [windowId]);

  const handleOpen = () => {
    switchTab(tabs[0]);
  };

  const handleCloseAll = () => {
    for (const id of tabIds) {
      browser.tabs.remove(id);
    }
    // browser.tabs.discard(tabIds);
  };

  return html`<div>${tabs.length} in window with ${windowTabs?.length} tabs <a onClick=${handleOpen}>open</a> <a onClick=${handleCloseAll}>close${tabs.length>1 ? ' all': ''}</a>
  </div>`;
}

function DuplicateTab({ url, tabs, onTabsChanged }) {
  const favIconUrl = tabs[0].favIconUrl;
  const title = (tabs.find(t => t.title !== t.url) ?? tabs[0]).title;
  const windowCount = new Set(tabs.map(tab => tab.windowId)).size;

  const tabsToRemove = tabs.sort(chain(
    inverse(bySelector(t => t.active)),
    bySelector(t => t.highlighted),
    bySelector(t => t.selected),
    bySelector(t => t.id)
  )).slice(1);

  const handleClose = () => {
    closeTabs(...tabsToRemove.map(t => t.id)).then(onTabsChanged);
  };

  const groupedByWindow = tabs.reduce((map, tab) => {
    const { windowId } = tab;
    map[windowId] = map[windowId] || [];
    map[windowId].push(tab);
    return map;
  }, {});

  return html`<div class="tab card">
  <div class="body">
    <span class="title">${title}</span>
    <span class="url">${url}</span> 
    <span class="windows">${Object.entries(groupedByWindow).map(([windowId, tabs]) => html`<${WindowDetails} windowId=${windowId} tabs=${tabs} />`)}</span>
  </div>
  <img src="${favIconUrl}"/>
  <span class="count">
    <span class="text">${tabs.length} in ${windowCount} window${windowCount !== 1 ? 's' : ''}</span>
    <${AsyncButton} onClick=${handleClose}>Close ${tabs.length - 1} tab${tabs.length>2 ?'s' :''}<//>
  </span>
  </div>`;
}

function addListenerToAll(handler, ...events) {
  for (const e of events) {
    e.addListener(handler);
  }

  return () => {
    for (const e of events) {
      e.removeListener(handler);
    }
  };
}

function Duplicates() {
  const [dupes, setDupes] = useState(null);

  const onTabsChanged = () => {
    getDupes().then(setDupes);
  };
  useEffect(() => {
    onTabsChanged();

    const unsub = addListenerToAll(onTabsChanged, browser.tabs.onRemoved, browser.tabs.onCreated, browser.tabs.onReplaced, browser.tabs.onUpdated);
    return unsub;
  }, []);

  if (dupes?.size > 0) {
    return html`<div>
    ${Array.from(dupes.entries()).map(([url, tabs]) =>
    html`<${DuplicateTab} key=${url} url=${url} tabs=${tabs} onTabsChanged=${onTabsChanged} />`)}
    <${Footer} />
    </div>`;
  }

  return html`<div class="no-results"><span>No duplicates</span> <${Footer} /></div>`;
}

const dest = document.getElementById('app');
render(html`<${Duplicates} />`, dest);