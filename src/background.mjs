/**
 * @typedef { import("./@types/global.js").Action } Action
 */
import {
  getCustomActionForOpenXmlUrl,
  getCustomActions,
  upsertCustomAction,
} from './services/customActions.mjs';
import './lib/webextension-polyfill.js';

import * as txml from './lib/txml.mjs';
import {
  ClearAllBrowsingData,
  ClearCache,
  ClearCookies,
  ClearHistory,
  ClearLocalStorage,
  ClearPasswords,
  CustomSearch,
  Options,
  RemoveDuplicateTabs,
  SaveFavIconUrl,
  SearchBookmarks,
} from './ActionNames.mjs';
import {
  clearAllData,
  clearBrowsingData,
  clearCache,
  clearCookies,
  clearLocalStorage,
  clearPasswords,
} from './actions/browsingDataActions.mjs';
import getDupes from './services/duplicateTabs.mjs';
import switchTab from './actions/switchTab.mjs';
import { saveFavIcon, getFavIcons } from './utils/cachedFavIcons.mjs';
import { bySelector, inverse } from './utils/sorters.mjs';
import { getOnePerUrl } from './common/HostsThatIgnoreHash.mjs';

const PermissionNames = {
  BrowsingData: 'browsingData',
};

// Clear actions and append default ones
const clearActions = async () => {
  const response = await getCurrentTab();
  const { permissions: currentPermissions } =
    await browser.permissions.getAll();
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  let muteaction = {
    title: 'Mute tab',
    desc: 'Mute the current tab',
    type: 'action',
    action: 'mute',
    emoji: true,
    emojiChar: '🔇',
    keycheck: true,
    keys: ['⌥', '⇧', 'M'],
  };
  let pinaction = {
    title: 'Pin tab',
    desc: 'Pin the current tab',
    type: 'action',
    action: 'pin',
    emoji: true,
    emojiChar: '📌',
    keycheck: true,
    keys: ['⌥', '⇧', 'P'],
  };
  if (response?.mutedInfo.muted) {
    muteaction = {
      title: 'Unmute tab',
      desc: 'Unmute the current tab',
      type: 'action',
      action: 'unmute',
      emoji: true,
      emojiChar: '🔈',
      keycheck: true,
      keys: ['⌥', '⇧', 'M'],
    };
  }
  if (response?.pinned) {
    pinaction = {
      title: 'Unpin tab',
      desc: 'Unpin the current tab',
      type: 'action',
      action: 'unpin',
      emoji: true,
      emojiChar: '📌',
      keycheck: true,
      keys: ['⌥', '⇧', 'P'],
    };
  }
  /**
   * @type {Array<Action>}
   */
  const actions = [
    {
      title: 'New tab',
      desc: 'Open a new tab',
      type: 'action',
      action: 'new-tab',
      emoji: true,
      emojiChar: '✨',
      keycheck: true,
      keys: ['⌘', 'T'],
    },
    {
      title: 'Bookmark',
      desc: 'Create a bookmark',
      type: 'action',
      action: 'create-bookmark',
      emoji: true,
      emojiChar: '📕',
      keycheck: true,
      keys: ['⌘', 'D'],
    },
    pinaction,
    {
      title: 'Fullscreen',
      desc: 'Make the page fullscreen',
      type: 'action',
      action: 'fullscreen',
      emoji: true,
      emojiChar: '🖥',
      keycheck: true,
      keys: ['⌘', 'Ctrl', 'F'],
    },
    muteaction,
    {
      title: 'Reload',
      desc: 'Reload the page',
      type: 'action',
      action: 'reload',
      emoji: true,
      emojiChar: '♻️',
      keycheck: true,
      keys: ['⌘', '⇧', 'R'],
    },
    // {
    //   title: "Help",
    //   desc: "Get help with Omni Launcher on GitHub",
    //   type: "action",
    //   action: "url",
    //   url: "omni-help.html",
    //   emoji: true,
    //   emojiChar: "🤔",
    //   keycheck: false,
    // },
    {
      title: 'Compose email',
      desc: 'Compose a new email',
      type: 'action',
      action: 'email',
      emoji: true,
      emojiChar: '✉️',
      keycheck: true,
      keys: ['⌥', '⇧', 'C'],
    },
    {
      title: 'New Notion page',
      desc: 'Create a new Notion page',
      type: 'action',
      action: 'url',
      url: 'https://notion.new',
      emoji: false,
      favIconUrl: browser.runtime.getURL('assets/logo-notion.png'),
      keycheck: false,
    },
    {
      title: 'New Sheets spreadsheet',
      desc: 'Create a new Google Sheets spreadsheet',
      type: 'action',
      action: 'url',
      url: 'https://sheets.new',
      emoji: false,
      favIconUrl: browser.runtime.getURL('assets/logo-sheets.png'),
      keycheck: false,
    },
    {
      title: 'New Docs document',
      desc: 'Create a new Google Docs document',
      type: 'action',
      action: 'url',
      emoji: false,
      url: 'https://docs.new',
      favIconUrl: browser.runtime.getURL('assets/logo-docs.png'),
      keycheck: false,
    },
    {
      title: 'New Slides presentation',
      desc: 'Create a new Google Slides presentation',
      type: 'action',
      action: 'url',
      url: 'https://slides.new',
      emoji: false,
      favIconUrl: browser.runtime.getURL('assets/logo-slides.png'),
      keycheck: false,
    },
    {
      title: 'New form',
      desc: 'Create a new Google Forms form',
      type: 'action',
      action: 'url',
      url: 'https://forms.new',
      emoji: false,
      favIconUrl: browser.runtime.getURL('assets/logo-forms.png'),
      keycheck: false,
    },
    {
      title: 'New Medium story',
      desc: 'Create a new Medium story',
      type: 'action',
      action: 'url',
      url: 'https://story.new',
      emoji: false,
      favIconUrl: browser.runtime.getURL('assets/logo-medium.png'),
      keycheck: false,
    },
    {
      title: 'New GitHub repository',
      desc: 'Create a new GitHub repository',
      type: 'action',
      action: 'url',
      url: 'https://github.new',
      emoji: false,
      favIconUrl: browser.runtime.getURL('assets/logo-github.png'),
      keycheck: false,
    },
    {
      title: 'New GitHub gist',
      desc: 'Create a new GitHub gist',
      type: 'action',
      action: 'url',
      url: 'https://gist.new',
      emoji: false,
      favIconUrl: browser.runtime.getURL('assets/logo-github.png'),
      keycheck: false,
    },
    {
      title: 'New CodePen pen',
      desc: 'Create a new CodePen pen',
      type: 'action',
      action: 'url',
      url: 'https://pen.new',
      emoji: false,
      favIconUrl: browser.runtime.getURL('assets/logo-codepen.png'),
      keycheck: false,
    },
    {
      title: 'New Excel spreadsheet',
      desc: 'Create a new Excel spreadsheet',
      type: 'action',
      action: 'url',
      url: 'https://excel.new',
      emoji: false,
      favIconUrl: browser.runtime.getURL('assets/logo-excel.png'),
      keycheck: false,
    },
    {
      title: 'New PowerPoint presentation',
      desc: 'Create a new PowerPoint presentation',
      type: 'action',
      url: 'https://powerpoint.new',
      action: 'url',
      emoji: false,
      favIconUrl: browser.runtime.getURL('assets/logo-powerpoint.png'),
      keycheck: false,
    },
    {
      title: 'New Word document',
      desc: 'Create a new Word document',
      type: 'action',
      action: 'url',
      url: 'https://word.new',
      emoji: false,
      favIconUrl: browser.runtime.getURL('assets/logo-word.png'),
      keycheck: false,
    },
    {
      title: 'Create a whiteboard',
      desc: 'Create a collaborative whiteboard',
      type: 'action',
      action: 'url',
      url: 'https://whiteboard.new',
      emoji: true,
      emojiChar: '🧑‍🏫',
      keycheck: false,
    },
    {
      title: 'Record a video',
      desc: 'Record and edit a video',
      type: 'action',
      action: 'url',
      url: 'https://recording.new',
      emoji: true,
      emojiChar: '📹',
      keycheck: false,
    },
    {
      title: 'Create a Figma file',
      desc: 'Create a new Figma file',
      type: 'action',
      action: 'url',
      url: 'https://figma.new',
      emoji: false,
      favIconUrl: browser.runtime.getURL('assets/logo-figma.png'),
      keycheck: false,
    },
    {
      title: 'Create a FigJam file',
      desc: 'Create a new FigJam file',
      type: 'action',
      action: 'url',
      url: 'https://figjam.new',
      emoji: true,
      emojiChar: '🖌',
      keycheck: false,
    },
    {
      title: 'Hunt a product',
      desc: 'Submit a product to Product Hunt',
      type: 'action',
      action: 'url',
      url: 'https://www.producthunt.com/posts/new',
      emoji: false,
      favIconUrl: browser.runtime.getURL('assets/logo-producthunt.png'),
      keycheck: false,
    },
    {
      title: 'Make a tweet',
      desc: 'Make a tweet on Twitter',
      type: 'action',
      action: 'url',
      url: 'https://twitter.com/intent/tweet',
      emoji: false,
      favIconUrl: browser.runtime.getURL('assets/logo-twitter.png'),
      keycheck: false,
    },
    {
      title: 'Create a playlist',
      desc: 'Create a Spotify playlist',
      type: 'action',
      action: 'url',
      url: 'https://playlist.new',
      emoji: false,
      favIconUrl: browser.runtime.getURL('assets/logo-spotify.png'),
      keycheck: false,
    },
    {
      title: 'Create a Canva design',
      desc: 'Create a new design with Canva',
      type: 'action',
      action: 'url',
      url: 'https://design.new',
      emoji: false,
      favIconUrl: browser.runtime.getURL('assets/logo-canva.png'),
      keycheck: false,
    },
    {
      title: 'Create a new podcast episode',
      desc: 'Create a new podcast episode with Anchor',
      type: 'action',
      action: 'url',
      url: 'https://episode.new',
      emoji: false,
      favIconUrl: browser.runtime.getURL('assets/logo-anchor.png'),
      keycheck: false,
    },
    {
      title: 'Edit an image',
      desc: 'Edit an image with Adobe Photoshop',
      type: 'action',
      action: 'url',
      url: 'https://photo.new',
      emoji: false,
      favIconUrl: browser.runtime.getURL('assets/logo-photoshop.png'),
      keycheck: false,
    },
    {
      title: 'Convert to PDF',
      desc: 'Convert a file to PDF',
      type: 'action',
      action: 'url',
      url: 'https://pdf.new',
      emoji: true,
      emojiChar: '📄',
      keycheck: false,
    },
    {
      title: 'Scan a QR code',
      desc: 'Scan a QR code with your camera',
      type: 'action',
      action: 'url',
      url: 'https://scan.new',
      emoji: false,
      favIconUrl: browser.runtime.getURL('assets/logo-qr.png'),
      keycheck: false,
    },
    {
      title: 'Add a task to Asana',
      desc: 'Create a new task in Asana',
      type: 'action',
      action: 'url',
      url: 'https://task.new',
      emoji: false,
      favIconUrl: browser.runtime.getURL('assets/logo-asana.png'),
      keycheck: false,
    },
    {
      title: 'Add an issue to Linear',
      desc: 'Create a new issue in Linear',
      type: 'action',
      action: 'url',
      url: 'https://linear.new',
      emoji: false,
      favIconUrl: browser.runtime.getURL('assets/logo-linear.png'),
      keycheck: false,
    },
    {
      title: 'Add a task to WIP',
      desc: 'Create a new task in WIP',
      type: 'action',
      action: 'url',
      url: 'https://todo.new',
      emoji: false,
      favIconUrl: browser.runtime.getURL('assets/logo-wip.png'),
      keycheck: false,
    },
    {
      title: 'Create an event',
      desc: 'Add an event to Google Calendar',
      type: 'action',
      action: 'url',
      url: 'https://cal.new',
      emoji: false,
      favIconUrl: browser.runtime.getURL('assets/logo-calendar.png'),
      keycheck: false,
    },
    {
      title: 'Add a note',
      desc: 'Add a note to Google Keep',
      type: 'action',
      action: 'url',
      emoji: false,
      url: 'https://note.new',
      favIconUrl: browser.runtime.getURL('assets/logo-keep.png'),
      keycheck: false,
    },
    {
      title: 'New meeting',
      desc: 'Start a Google Meet meeting',
      type: 'action',
      action: 'url',
      emoji: false,
      url: 'https://meet.new',
      favIconUrl: browser.runtime.getURL('assets/logo-meet.png'),
      keycheck: false,
    },
    {
      title: 'Browsing history',
      desc: 'Browse through your browsing history',
      type: 'action',
      action: 'history',
      emoji: true,
      emojiChar: '🗂',
      keycheck: true,
      keys: ['⌘', 'Y'],
    },
    {
      title: 'Incognito mode',
      desc: 'Open an incognito window',
      type: 'action',
      action: 'incognito',
      emoji: true,
      emojiChar: '🕵️',
      keycheck: true,
      keys: ['⌘', '⇧', 'N'],
    },
    {
      title: 'Downloads',
      desc: 'Browse through your downloads',
      type: 'action',
      action: 'downloads',
      emoji: true,
      emojiChar: '📦',
      keycheck: true,
      keys: ['⌘', '⇧', 'J'],
    },
    {
      title: 'Extensions',
      desc: 'Manage your Chrome Extensions',
      type: 'action',
      action: 'extensions',
      emoji: true,
      emojiChar: '🧩',
      keycheck: false,
      keys: ['⌘', 'D'],
    },
    {
      title: 'Chrome settings',
      desc: 'Open the Chrome settings',
      type: 'action',
      action: 'settings',
      emoji: true,
      emojiChar: '⚙️',
      keycheck: true,
      keys: ['⌘', ','],
    },
    {
      title: 'Scroll to bottom',
      desc: 'Scroll to the bottom of the page',
      type: 'action',
      action: 'scroll-bottom',
      emoji: true,
      emojiChar: '👇',
      keycheck: true,
      keys: ['⌘', '↓'],
    },
    {
      title: 'Scroll to top',
      desc: 'Scroll to the top of the page',
      type: 'action',
      action: 'scroll-top',
      emoji: true,
      emojiChar: '👆',
      keycheck: true,
      keys: ['⌘', '↑'],
    },
    {
      title: 'Go back',
      desc: 'Go back in history for the current tab',
      type: 'action',
      action: 'go-back',
      emoji: true,
      emojiChar: '👈',
      keycheck: true,
      keys: ['⌘', '←'],
    },
    {
      title: 'Go forward',
      desc: 'Go forward in history for the current tab',
      type: 'action',
      action: 'go-forward',
      emoji: true,
      emojiChar: '👉',
      keycheck: true,
      keys: ['⌘', '→'],
    },
    {
      title: 'Duplicate tab',
      desc: 'Make a copy of the current tab',
      type: 'action',
      action: 'duplicate-tab',
      emoji: true,
      emojiChar: '📋',
      keycheck: true,
      keys: ['⌥', '⇧', 'D'],
    },
    {
      title: 'Close tab',
      desc: 'Close the current tab',
      type: 'action',
      action: 'close-tab',
      emoji: true,
      emojiChar: '🗑',
      keycheck: true,
      keys: ['⌘', 'W'],
    },
    {
      title: 'Close window',
      desc: 'Close the current window',
      type: 'action',
      action: 'close-window',
      emoji: true,
      emojiChar: '💥',
      keycheck: true,
      keys: ['⌘', '⇧', 'W'],
    },
    {
      title: 'Manage browsing data',
      desc: 'Manage your browsing data',
      type: 'action',
      action: 'manage-data',
      emoji: true,
      emojiChar: '🔬',
      keycheck: true,
      keys: ['⌘', '⇧', 'Delete'],
    },
    {
      title: 'Clear all browsing data',
      desc: 'Clear all of your browsing data',
      type: 'action',
      action: ClearAllBrowsingData,
      requiresPermission: PermissionNames.BrowsingData,
      emoji: true,
      emojiChar: '🧹',
      keycheck: false,
      keys: ['⌘', 'D'],
    },
    {
      title: 'Clear browsing history',
      desc: 'Clear all of your browsing history',
      type: 'action',
      action: ClearHistory,
      requiresPermission: PermissionNames.BrowsingData,
      emoji: true,
      emojiChar: '🗂',
      keycheck: false,
      keys: ['⌘', 'D'],
    },
    {
      title: 'Clear cookies',
      desc: 'Clear all cookies',
      type: 'action',
      action: ClearCookies,
      requiresPermission: PermissionNames.BrowsingData,
      emoji: true,
      emojiChar: '🍪',
      keycheck: false,
      keys: ['⌘', 'D'],
    },
    {
      title: 'Clear cache',
      desc: 'Clear the cache',
      type: 'action',
      action: ClearCache,
      emoji: true,
      emojiChar: '🗄',
      keycheck: false,
      keys: ['⌘', 'D'],
      requiresPermission: PermissionNames.BrowsingData,
    },
    {
      title: 'Clear local storage',
      desc: 'Clear the local storage',
      type: 'action',
      action: ClearLocalStorage,
      requiresPermission: PermissionNames.BrowsingData,
      emoji: true,
      emojiChar: '📦',
      keycheck: false,
      keys: ['⌘', 'D'],
    },
    {
      title: 'Clear passwords',
      desc: 'Clear all saved passwords',
      type: 'action',
      action: ClearPasswords,
      requiresPermission: PermissionNames.BrowsingData,
      emoji: true,
      emojiChar: '🔑',
      keycheck: false,
      keys: ['⌘', 'D'],
    },
    {
      title: 'Options',
      desc: 'Omni Launcher options',
      type: 'action',
      action: Options,
      favIconUrl: browser.runtime.getURL('assets/omni-logo-orange-dynamic.svg'),
    },
  ];

  for (const action of actions) {
    if (action.requiresPermission) {
      // check if have permission
      action.hasPermission = currentPermissions.includes(
        action.requiresPermission
      );
      // if (!action.hasPermission) {
      //   action.emojiChar = "🚫";
      // }
    }
  }

  if (!isMac) {
    for (let action of actions) {
      switch (action.action) {
      case 'reload':
        action.keys = ['F5'];
        break;
      case 'fullscreen':
        action.keys = ['F11'];
        break;
      case 'downloads':
        action.keys = ['Ctrl', 'J'];
        break;
      case 'settings':
        action.keycheck = false;
        break;
      case 'history':
        action.keys = ['Ctrl', 'H'];
        break;
      case 'go-back':
        action.keys = ['Alt', '←'];
        break;
      case 'go-forward':
        action.keys = ['Alt', '→'];
        break;
      case 'scroll-top':
        action.keys = ['Home'];
        break;
      case 'scroll-bottom':
        action.keys = ['End'];
        break;
      }
      for (const key in action.keys) {
        if (action.keys[key] === '⌘') {
          action.keys[key] = 'Ctrl';
        } else if (action.keys[key] === '⌥') {
          action.keys[key] = 'Alt';
        }
      }
    }
  }

  return actions;
};

// Open on install
browser.runtime.onInstalled.addListener(async (object) => {
  // Inject Omni Launcher on install
  const manifest = browser.runtime.getManifest();

  const injectIntoTab = async (tab) => {
    const { url, id: tabId, status } = tab;
    console.log(`injecting scripts into tab ${url}`, tab);
    if (!url.toLowerCase().startsWith('http')) {
      console.debug(`Skipping ${tab.url}`);
      return;
    }

    saveFavIcon(tab.url, tab.favIconUrl);

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
  };

  // Get all windows
  const windows = await browser.windows.getAll({
    populate: true,
  });

  for (const currentWindow of windows) {
    for (const currentTab of currentWindow.tabs) {
      try {
        await injectIntoTab(currentTab);
      } catch (e) {
        console.error(`Problem injecting into tab ${currentTab.url}`, e);
      }
    }
  }

  if (object.reason === 'install') {
    // TODO: open a tab with instructions what to do next
    // browser.tabs.create({ url: "omni-help.html" });
  }
});

// Check when the extension button is clicked
browser.action.onClicked.addListener((tab) => {
  browser.tabs.sendMessage(tab.id, { request: 'open-omni' });
});

// Listen for the open Omni Launcher shortcut
browser.commands.onCommand.addListener(async (command) => {
  if (command === 'open-omni') {
    const tabs = await browser.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (tabs.length > 0)
      browser.tabs.sendMessage(tabs[0].id, { request: 'open-omni' });
  }
});

// Get the current tab
const getCurrentTab = async () => {
  const queryOptions = { active: true, currentWindow: true };
  const [tab] = await browser.tabs.query(queryOptions);
  return tab;
};

// Get tabs to populate in the actions
const getTabs = async () => {
  const tabs = await browser.tabs.query({});
  /** @type {Array<Action>} */
  const result = [];

  // check for duplicates
  const duplicates = await getDupes(tabs);
  const duplicatedTabById = Array.from(duplicates.values()).flat().reduce(
    (dupMap, dup) => ({
      ...dupMap,
      [dup.id]: dup,
    }),
    {}
  );

  if (duplicates.size > 0) {
    const tabCountToRemove = Array.from(duplicates.entries())
      .map(([, tabs]) => tabs.length - 1)
      .reduce((a, b) => a + b);
    result.push({
      type: 'action',
      action: RemoveDuplicateTabs,
      title: `Remove ${tabCountToRemove} duplicate tabs`,
      desc: `Remove ${tabCountToRemove} duplicate tabs`,
    });
  }

  // find Meeting tabs and put them first
  tabs.sort(inverse(bySelector((tab) => tab.url?.includes('meet.google.com'))));

  tabs.forEach((tab) => saveFavIcon(tab.url, tab.favIconUrl));

  result.push(
    ...tabs.map((tab) => ({
      ...tab,
      title: tab.title,
      desc: 'Chrome tab',
      keycheck: false,
      action: 'switch-tab',
      type: 'tab',
      isDuplicate: !!duplicatedTabById[tab.id],
    }))
  );

  return result;
};

// Get bookmarks to populate in the actions
const getBookmarks = async () => {
  /**
   * @type { Array<Action> }
   */
  const result = [];
  const process_bookmark = (bookmarks) => {
    for (const bookmark of bookmarks) {
      if (bookmark.url) {
        result.push({
          title: bookmark.title,
          desc: 'Bookmark',
          id: bookmark.id,
          url: bookmark.url,
          type: 'bookmark',
          action: 'bookmark',
          emoji: true,
          emojiChar: '⭐️',
          keycheck: false,
        });
      }
      if (bookmark.children) {
        process_bookmark(bookmark.children);
      }
    }
  };

  process_bookmark(await browser.bookmarks.getRecent(100));
  // add in icons
  const favIconsByUrl = await getFavIcons(result.map((r) => r.url));
  console.log('favIconsByUrl', favIconsByUrl);
  result.forEach((r) => (r.favIconUrl = favIconsByUrl[r.url]));
  return result;
};

// Lots of different actions
const goBack = (tab) => {
  browser.tabs.goBack(tab.id);
};
const goForward = (tab) => {
  browser.tabs.goForward(tab.id);
};
const duplicateTab = () => {
  getCurrentTab().then((response) => {
    browser.tabs.duplicate(response.id);
  });
};
const createBookmark = () => {
  getCurrentTab().then((response) => {
    browser.bookmarks.create({
      title: response.title,
      url: response.url,
    });
  });
};
const muteTab = (mute) => {
  getCurrentTab().then((response) => {
    browser.tabs.update(response.id, { muted: mute });
  });
};
const reloadTab = () => {
  browser.tabs.reload();
};
const pinTab = (pin) => {
  getCurrentTab().then((response) => {
    browser.tabs.update(response.id, { pinned: pin });
  });
};

const openChromeUrl = (url) => {
  browser.tabs.create({ url: 'chrome://' + url + '/' });
};
const openIncognito = () => {
  browser.windows.create({ incognito: true });
};
const closeWindow = (id) => {
  browser.windows.remove(id);
};
const closeTab = (tab) => {
  browser.tabs.remove(tab.id);
};
const closeCurrentTab = () => {
  getCurrentTab().then(closeTab);
};
const removeBookmark = (bookmark) => {
  browser.bookmarks.remove(bookmark.id);
};

async function getActions() {
  return [
    ...(await getTabs()),
    ...(await getCustomActions()),
    ...(await clearActions()),
    ...(await getBookmarks()),
  ];
}

// Receive messages from any tab
browser.runtime.onMessage.addListener(async (message, sender) => {
  console.debug('got message', message);
  const hasPermission = message.action?.hasPermission;

  if (hasPermission === false) {
    browser.runtime.openOptionsPage();
    return;
  }

  switch (message.request) {
  case 'get-actions':
    return { actions: await getActions() };
  case 'switch-tab':
    switchTab(message.tab);
    break;
  case 'go-back':
    goBack(message.tab);
    break;
  case 'go-forward':
    goForward(message.tab);
    break;
  case 'duplicate-tab':
    duplicateTab();
    break;
  case 'create-bookmark':
    createBookmark();
    break;
  case 'mute':
    muteTab(true);
    break;
  case 'unmute':
    muteTab(false);
    break;
  case 'reload':
    reloadTab();
    break;
  case 'pin':
    pinTab(true);
    break;
  case 'unpin':
    pinTab(false);
    break;
  case ClearAllBrowsingData:
    clearAllData();
    break;
  case ClearHistory:
    clearBrowsingData();
    break;
  case ClearCookies:
    clearCookies();
    break;
  case ClearCache:
    clearCache();
    break;
  case ClearLocalStorage:
    clearLocalStorage();
    break;
  case ClearPasswords:
    clearPasswords();
    break;
  case Options:
    browser.runtime.openOptionsPage();
    break;
  case 'history': // Fallthrough
  case 'downloads':
  case 'extensions':
  case 'settings':
  case 'extensions/shortcuts':
    openChromeUrl(message.request);
    break;
  case 'manage-data':
    openChromeUrl('settings/clearBrowserData');
    break;
  case 'incognito':
    openIncognito();
    break;
  case 'close-window':
    closeWindow(sender.tab.windowId);
    break;
  case 'close-tab':
    closeCurrentTab();
    break;
  case 'search-history': {
    console.debug(`searching history for "${message.query}"`, message);
    const data = await browser.history.search({
      text: message.query,
      maxResults: message.maxResults || 1000,
      startTime: 31536000000 * 5,
    });
    const favIcons = await getFavIcons(data.map((item) => item.url));
    const history = await getOnePerUrl(data.map((action) => ({
      ...action,
      favIconUrl: favIcons[action.url],
      type: 'history',
      emoji: true,
      emojiChar: '🏛',
      action: 'history',
      keyCheck: false,
    })), 'url');
    return { history };
  }
  case SearchBookmarks: {
    const data = await browser.bookmarks.search({ query: message.query });
    const favIcons = await getFavIcons(data.map((b) => b.url));

    return {
      bookmarks: data
        .filter((a) => a.url)
        .map((action) => {
          return {
            ...action,
            type: 'bookmark',
            emoji: true,
            emojiChar: '⭐️',
            action: 'bookmark',
            keyCheck: false,
            favIconUrl: favIcons[action.url],
          };
        })
        .filter(Boolean),
    };
  }
  case 'remove':
    if (message.type == 'bookmark') {
      removeBookmark(message.action);
    } else {
      closeTab(message.action);
    }
    break;
  case 'add-search-engine':
    saveFavIcon(message.url, message.favIconUrl);
    return await addSearchEngine(
      message.title,
      message.url,
      message.favIconUrl
    );
  case SaveFavIconUrl:
    saveFavIcon(message.url, message.favIconUrl);
    return;
  case RemoveDuplicateTabs:
    return await browser.tabs.create({
      url: browser.runtime.getURL('/ui/duplicate-tabs.html'),
    });
  default:
    console.warn(`Unable to handle message: ${JSON.stringify(message)}`);
    return false;
  }
});

async function addSearchEngine(title, url, favIconUrl) {
  const existingAction = await getCustomActionForOpenXmlUrl(url);
  if (existingAction) {
    console.warn(`Custom action for ${url} already exists.`);
    return;
  }

  console.debug(`Adding search engine ${title}`);
  const response = await fetch(url);
  const text = await response.text();
  console.debug(`got response from ${url} for ${title}:`, text);
  const parsed = txml.parse(text);
  console.log('parsed: ', parsed);
  const el = parsed.find((el) => el.tagName === 'OpenSearchDescription');

  if (el && typeof el !== 'string' && el.tagName === 'OpenSearchDescription') {
    /*
  {
      title: "Bookmark",
      desc: "Create a bookmark",
      type: "action",
      action: "create-bookmark",
      emoji: true,
      emojiChar: "📕",
      keycheck: true,
      keys: ["⌘", "D"],
    },
  */
    const props = { action: CustomSearch, openSearchXmlUrl: url };
    for (const child of el.children) {
      if (typeof child !== 'string') {
        const { tagName: name } = child;
        const value = child.children[0];
        switch (name) {
        case 'ShortName':
          props.title = value;
          break;
        case 'Description':
          props.desc = value;
          break;
        case 'Image':
          props.favIconUrl = value;
          break;
        case 'Url': {
          const { type, template } = child.attributes;
          if (type === 'application/opensearchdescription+xml') {
            console.warn(`skipping type ${type} with url ${template}`);
          } else {
            props.url = template;
          }
        }
        }
      }
    }

    // checking image URL...
    if (props.favIconUrl) {
      if (props.favIconUrl.startsWith('data:')) {
        delete props.favIconUrl;
      } else {
        try {
          const r = await fetch(props.favIconUrl);
          if (!r.ok) {
            throw new Error(r.statusText);
          }
          console.debug(
            `icon is valid for ${props.title} at ${props.favIconUrl}`,
            r
          );
        } catch (e) {
          console.warn(
            `icon is invalid valid for ${props.title} at ${props.favIconUrl}`,
            e
          );
          delete props.favIconUrl;
        }
      }
    }

    if (!props.favIconUrl && favIconUrl) {
      props.favIconUrl = favIconUrl;
    }

    if (!props.shortcut && props.url) {
      const parts = new URL(props.url).host
        .split('.')
        .filter((p) => p !== 'www');
      props.shortcut = parts.join('.');
    }

    console.log('determined action: ', props);
    if (props.title && props.url) {
      try {
        await upsertCustomAction(props);
      } catch (e) {
        console.error('Problem upserting custom search engine', props, e);
        throw e;
      }
    }
  }
}
