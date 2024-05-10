/**
 * @typedef { import("../@types/global.js").Action } Action
 */
import '../lib/webextension-polyfill.js';

import {
  html,
  render,
} from '../lib/htm-preact-standalone.mjs';

import MainApp, { CloseOmniAction } from '../content.mjs';

/**
 * @param {Action} action 
 * @returns 
 */
function handleAction(action) {
  const openUrl = (url = action.url) => window.location.href = url;
  switch (action.action) {
  case 'scroll-bottom':
    window.scrollTo(0, document.body.scrollHeight);
    break;
  case 'scroll-top':
    window.scrollTo(0, 0);
    break;
  case 'url':
  case 'bookmark':
  case 'navigation':
  case 'history':
    openUrl();
    break;
  case 'fullscreen':
    var elem = document.documentElement;
    elem.requestFullscreen();
    break;
  case 'new-tab':
    window.open('');
    break;
  case 'email':
    window.open('mailto:');
    break;
  default:
    console.error(`NO HANDLER FOR ${action.action}`);
    if (action.url) {
      openUrl();
      return;
    }
  }
}

const actionHandler = async (action, eventOptions) => {
  console.log('HANDLING ACTION!', action, eventOptions);
  if (action.action === CloseOmniAction) {
    return;
  }
  
  if (action.action === 'history' && action.url) {
    handleAction(action);
    return;
  }

  const response = await browser.runtime.sendMessage({
    request: eventOptions?.request || action.action,
    payload: action.payload,
    tab: action,
    action,
  });
  if (response === false) {
    console.warn(`NOTHING DONE IN BG FOR ${action.action}`, action);
    handleAction(action);
  }
};

const dest = document.getElementById('app');
render(html`<${MainApp} showing=${true} handleAction=${actionHandler} />`, dest);