import Browser from 'webextension-polyfill';
declare global {
  var browser: typeof Browser;
}