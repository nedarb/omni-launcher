import '../lib/webextension-polyfill.js';

import {
  html,
  render,
} from '../lib/htm-preact-standalone.mjs';
import CustomActions from './CustomActions.mjs';
import Footer from '../components/Footer.mjs';
import OptionalPermission from './OptionalPermissions.mjs';
import GroupWithoutHash from './GroupWithoutHash.mjs';

const url = browser.runtime.getURL('../assets/omni-logo-orange-dynamic.svg');

render(
  html`<div>
  <img class="logo" src="${url}" />
    <${OptionalPermission} />
    <${GroupWithoutHash} />
    <${CustomActions} />
    <${Footer} />
  </div>`,
  document.getElementById('app')
);
