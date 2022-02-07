import '../lib/webextension-polyfill.js';

import {
  html,
  render,
  useEffect,
  useState,
} from '../lib/htm-preact-standalone.mjs';
import classNames from '../utils/classNames.mjs';

function timeout(promise) {
  const errorToken = {};
  return Promise.race([promise, delay(1000, errorToken)]).then(result => {
    if (result === errorToken) {
      return Promise.reject(new Error('timeout'));
    }
  });
}
function delay(timeInMs = 1000, returnValue) {
  return new Promise(r => setTimeout(r.bind(this, returnValue), timeInMs));
}

async function injectScripts() {
  // Inject Omni Launcher on install
  const manifest = browser.runtime.getManifest();

  const injectIntoTab = async (tab) => {
    const { url, id: tabId, status } = tab;
    console.log(`injecting scripts into tab ${url}`, tab);
    if (!url.toLowerCase().startsWith('http')) {
      console.debug(`Skipping ${tab.url}`);
      return;
    }

    if (status === 'unloaded') {
      console.debug(`Skipping ${tab.url} because it's status is "unloaded".`);
      return;
    }

    const scripts = manifest.content_scripts[0].js;

    await browser.scripting.executeScript({
      target: { tabId },
      files: [...scripts],
    });

    await browser.scripting.insertCSS({
      target: { tabId },
      files: [...manifest.content_scripts[0].css],
    });
    console.log(`done with tab ${url}`, tab);
  };

  // Get all windows
  const windows = await browser.windows.getAll({
    populate: true,
  });

  for (const currentWindow of windows) {
    for (const currentTab of currentWindow.tabs) {
      try {
        await timeout(injectIntoTab(currentTab));
      } catch (e) {
        console.error(`Problem injecting into tab ${currentTab.url}`, e);
      }
    }
  }

  console.log('All done');
}

function App() {
  const [state, setState] = useState(false);
  const handleClick = async () => {
    setState('running');
    await injectScripts();
    setState('done');
  };
  return html`<div><h1>Thanks for installing Omni Launcher!</h1>
  Would you like to enable this on your open tabs?
  <p>
  <button class="${classNames(state)}" onClick=${handleClick}> <img src="../assets/omni-logo-orange.svg"/></button>
  </p>
  </div>`;
}

render(
  html`<${App} />`,
  document.getElementById('omni-wrap')
);