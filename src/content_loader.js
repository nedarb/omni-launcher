/**
 * This bootstraps the first ES6 module as we can't natively instruct Chrome to load a module in the manifest
 */
(async () => {
  const src = chrome.runtime.getURL("content.mjs");

  const div = document.createElement("div");
  div.id = "omni-extension-wrapper";
  document.body.appendChild(div);

  await import(src);
})();
