const switchTab = (tab) => {
  browser.tabs.highlight({
    tabs: tab.index,
    windowId: tab.windowId,
  });
  browser.windows.update(tab.windowId, { focused: true });
};
export default switchTab;