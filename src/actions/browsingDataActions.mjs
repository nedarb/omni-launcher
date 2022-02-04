import '../lib/webextension-polyfill.js';

export const clearAllData = () => {
  browser.browsingData.remove(
    {
      since: new Date().getTime(),
    },
    {
      appcache: true,
      cache: true,
      cacheStorage: true,
      cookies: true,
      downloads: true,
      fileSystems: true,
      formData: true,
      history: true,
      indexedDB: true,
      localStorage: true,
      passwords: true,
      serviceWorkers: true,
      webSQL: true,
    }
  );
};

export const clearBrowsingData = () => {
  browser.browsingData.removeHistory({ since: 0 });
};
export const clearCookies = () => {
  browser.browsingData.removeCookies({ since: 0 });
};
export const clearCache = () => {
  browser.browsingData.removeCache({ since: 0 });
};
export const clearLocalStorage = () => {
  browser.browsingData.removeLocalStorage({ since: 0 });
};
export const clearPasswords = () => {
  browser.browsingData.removePasswords({ since: 0 });
};
