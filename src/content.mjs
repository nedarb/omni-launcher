/**
 * @typedef { import("./@types/global.js").Action } Action
 */
import './lib/webextension-polyfill.js';

import {
  html,
  render,
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from './lib/htm-preact-standalone.mjs';
import useDebounce from './hooks/useDebounce.mjs';
import useAsyncState from './hooks/useAsyncState.mjs';
import SearchResultsWrapper from './components/SearchResultsWrapper.mjs';
import * as ActionNames from './ActionNames.mjs';
import filterActions from './services/actionsFilter.mjs';
import classNames from './utils/classNames.mjs';

const openSearchDescEl = document.head.querySelector('link[rel="search"]');
const favIconEl = document.head.querySelector('link[rel*="icon"]');
if (openSearchDescEl) {
  browser.runtime.sendMessage({
    request: 'add-search-engine',
    title: document.title,
    url: openSearchDescEl.href,
    favIconUrl: favIconEl?.href,
  });
} else if (favIconEl) {
  browser.runtime.sendMessage({
    request: ActionNames.SaveFavIconUrl,
    title: document.title,
    url: window.location.href,
    favIconUrl: favIconEl?.href,
  });
}

export const CloseOmniAction = 'close-omni';

/**
 * @type { Array<Action> }
 */
const Commands = [
  {
    title: 'History',
    desc: 'Search browsing history',
    type: 'command',
    shortcut: '/h',
    searchPrefix: '/history',
    emoji: true,
    emojiChar: '🏛',
  },
  {
    title: 'Tabs',
    desc: 'Search your open tabs',
    type: 'command',
    shortcut: '/t',
    searchPrefix: '/tabs',
  },
  {
    title: 'Bookmarks',
    desc: 'Search bookmarks',
    type: 'command',
    shortcut: '/b',
    searchPrefix: '/bookmarks',
    emoji: true,
    emojiChar: '📕',
  },
  {
    title: 'Actions',
    desc: 'Search actions',
    type: 'command',
    shortcut: '/a',
    searchPrefix: '/actions',
  },
  {
    title: 'Remove',
    desc: 'Remove a tab or a bookmark',
    type: 'command',
    shortcut: '/r',
    searchPrefix: '/remove',
    emoji: true,
    emojiChar: '🧹',
  },
];

/**
 * @param {Action} action 
 * @param {*} eventOptions 
 * @returns 
 */
function handleAction(action, eventOptions) {
  const openUrl = (url = action.url) =>
    eventOptions?.metaKey ? window.open(url) : window.open(url, '_self');
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
  case CloseOmniAction:
    console.debug('Closing Omni');
    break;
  default:
    console.error(`NO HANDLER FOR ${action.action}`);
    if (action.url) {
      openUrl();
      return;
    }
  }
}

function HistorySearch({ searchTerm, handleAction }) {
  // const [searched, setSearched] = useState([]);
  const searched = useAsyncState(
    async () => {
      console.log('searching history');
      const query = searchTerm.replace(/\/history\s*/, '');

      console.log('searching history', query);
      const response = await browser.runtime.sendMessage({
        request: 'search-history',
        query,
        maxResults: !query ? 30 : 300,
      });
      return response.history;
    },
    [],
    [searchTerm]
  );

  if (!searched) {
    console.log('!searched!', searched);
    return null;
  }
  return html`<${SearchResultsWrapper}
    actions=${searched}
    handleAction=${handleAction}
  />`;
}

function BookmarksSearch({ searchTerm, allActions, handleAction }) {
  const searchedActions = useAsyncState(
    async () => {
      const tempvalue = searchTerm.replace('/bookmarks ', '');
      if (tempvalue != '/bookmarks' && tempvalue != '') {
        const query = searchTerm.replace('/bookmarks ', '');
        const response = await browser.runtime.sendMessage({
          request: ActionNames.SearchBookmarks,
          query,
        });
        console.log('got bookmarks', response);
        return response.bookmarks;
      } else {
        return allActions.filter((x) => x.type == 'bookmark');
      }
    },
    [],
    [searchTerm, allActions]
  );

  return html`<${SearchResultsWrapper}
    actions=${searchedActions}
    handleAction=${handleAction}
  />`;
}

function RenderCommands({ handleAction }) {
  return html`<${SearchResultsWrapper}
    actions=${Commands}
    handleAction=${handleAction}
  />`;
}

function RemoveList({ searchTerm, actions, handleAction }) {
  const filtered = useMemo(() => {
    const lower = searchTerm.toLowerCase();
    return actions.filter(
      (a) =>
        (a.type === 'bookmark' || a.type === 'tab') &&
        (a.title.toLowerCase().includes(lower) ||
          a.url?.toLowerCase().includes(lower))
    );
  }, [searchTerm, actions]);
  const doHandle = useCallback(
    (action, options, ...args) => {
      console.log(`Removing ${action.title}`, action);
      handleAction(action, { ...options, request: 'remove' }, ...args);
    },
    [actions, handleAction]
  );

  return html`<${SearchResultsWrapper}
    actions=${filtered}
    handleAction=${doHandle}
    selectVerb="Remove"
  />`;
}

function OmniList({ searchTerm, handleAction }) {
  const [allActions, setAllActions] = useState([]);
  const [filteredActions, setFiltered] = useState([]);
  const lowerTerm = searchTerm.toLowerCase();

  const customActions = allActions.filter(
    (a) => a.action === ActionNames.CustomSearch
  );
  const customAction = customActions.find(
    (a) => lowerTerm.split(' ')[0].toLowerCase() === a.shortcut
  );

  // console.log("foobar");
  const historySearchResults = useAsyncState(
    async () => {
      if (!searchTerm || searchTerm.startsWith('/') || customAction) {
        return;
      }

      console.log('searching history', searchTerm);
      const response = await browser.runtime.sendMessage({
        request: 'search-history',
        query: searchTerm,
        maxResults: 50,
      });
      return response.history;
    },
    [],
    [searchTerm]
  );
  // console.log("tempHistory", tempHistory);

  useEffect(async () => {
    const response = await browser.runtime.sendMessage({
      request: 'get-actions',
    });
    // console.log(`get-actions`, response.actions.reduce((map, item) => {
    //   map[item.type] = (map[item.type] || 0) + 1;
    //   return map;
    // }, {}), response.actions);
    setAllActions(response.actions);
  }, []);

  useEffect(() => {
    if (
      lowerTerm.startsWith('/history') ||
      lowerTerm.startsWith('/bookmarks' || customAction)
    ) {
      return;
    }

    if (lowerTerm.startsWith('instagram ')) {
      const tempvalue = searchTerm.replace(/instagram\s*/, '').toLowerCase();
      const url = tempvalue.startsWith('#')
        ? `https://www.instagram.com/explore/tags/${tempvalue}/`
        : `https://www.instagram.com/explore/search/keyword/?q=${encodeURIComponent(
          tempvalue
        )}`;
      setFiltered([
        {
          title: `Search instagram for ${tempvalue}`,
          desc: `Search instagram for ${tempvalue}`,
          type: 'action',
          url,
          favIconUrl:
            'https://www.instagram.com/static/images/ico/favicon.ico/36b3ee2d91ed.ico',
          action: 'url',
          // emoji: true,
          // emojiChar: "🗄",
          keycheck: false,
        },
      ]);
      return;
    }

    const filtered = filterActions(searchTerm, allActions);
    console.log('filtered down to ', filtered);
    setFiltered(filtered);
  }, [allActions, searchTerm]);

  // check custom action
  // if (customAction) {
  //   const query = searchTerm.split(" ").slice(1).join(" ");
  //   if (query) {
  //     return html`<${CustomSearch}
  //       customAction=${customAction}
  //       searchTerm=${searchTerm}
  //       handleAction=${handleAction}
  //     />`;
  //   }
  // }

  if (searchTerm.startsWith('/remove')) {
    return html`<${RemoveList}
      actions=${allActions}
      searchTerm=${searchTerm.replace(/^\/remove\s*/, '')}
      handleAction=${handleAction}
    />`;
  }

  if (searchTerm.startsWith('/history')) {
    return html`<${HistorySearch}
      searchTerm=${searchTerm}
      handleAction=${handleAction}
    />`;
  }
  if (searchTerm.startsWith('/bookmarks')) {
    return html`<${BookmarksSearch}
      searchTerm=${searchTerm}
      allActions=${allActions}
      handleAction=${handleAction}
    />`;
  }

  if (
    searchTerm.startsWith('/') &&
    !Commands.some((a) => searchTerm.startsWith(a.searchPrefix))
  ) {
    return html`<${RenderCommands} handleAction=${handleAction} />`;
  }

  const tabs = allActions.filter(tab=>tab.type=== 'tab');
  const totalTabs = tabs.length;
  const totalWindows = new Set(tabs.map(tab=>tab.windowId)).size;
  return html`<${SearchResultsWrapper}
    actions=${[...filteredActions, ...(historySearchResults || [])]}
    handleAction=${handleAction}
    footer=${html`<span style='font-style: italic'>${totalTabs} tabs in ${totalWindows} window${totalWindows !== 1 ? 's' : ''}</span>`}
  />`;
}

const Shortcuts = {
  '/h': '/history',
  '/t': '/tabs',
  '/b': '/bookmarks',
  '/a': '/actions',
  '/r': '/remove',
};

export default function MainApp(props) {
  const { showing, handleAction } = props;
  const [search, setSearch] = useState('');
  const debouncedSearchTerm = useDebounce(search, 250);
  const input = useRef(null);
  const onSearchChange = useCallback((e) => {
    e.preventDefault();
    const newValue = e.target.value;
    const shortcut = Shortcuts[newValue];
    if (shortcut) {
      setSearch(shortcut + ' ');
      return;
    }
    setSearch(Shortcuts[newValue] || newValue);
  }, []);

  useEffect(() => {
    if (showing) {
      const timeout = setTimeout(
        () => input.current && input.current.focus(),
        100
      );
      return () => clearTimeout(timeout);
    } else {
      setSearch('');
    }
  }, [showing]);

  const doHandle = useCallback(
    (action, ...args) => {
      if (action.searchPrefix) {
        setSearch(action.searchPrefix);
        return;
      }

      setSearch('');
      handleAction(action, ...args);
    },
    [handleAction]
  );

  const onOverlayClick = useCallback(() => {
    handleAction({ action: CloseOmniAction });
  }, [handleAction]);

  const handleKeyUp = useCallback(e=>{
    if (e.code?.startsWith('Key')) {
      e.stopPropagation();
    }
  }, []);

  return html`<div
    id="omni-launcher-extension"
    class="${classNames('omni-launcher-extension', !showing && 'omni-closing')}"
  >
    <div id="omni-overlay" class="overlay" onClick=${onOverlayClick}></div>
    ${showing && html`<div class="omni">
      <div class="header"><div id="omni-search" class="omni-search">
      <input
        ref=${input}
        placeholder="Type a command or search"
        value=${search}
        onInput=${onSearchChange}
        onKeyDown=${handleKeyUp}
      />
    </div></div>
      <!-- OMNI LIST -->
      <${OmniList}
        searchTerm=${debouncedSearchTerm}
        handleAction=${doHandle}
      />
    </div>`}
  </div>`;
}

export function App({ isOpen: isOpenByDefault } = { isOpen: false}) {
  const [isOpen, setIsOpen] = useState(isOpenByDefault);
  useEffect(() => {
    // Recieve messages from background
    browser.runtime.onMessage.addListener((message) => {
      if (message.request == 'open-omni') {
        setIsOpen((isOpen) => !isOpen);
      }
    });
  }, []);

  useEffect(() => {
    if (isOpen) {
      const onKeyDown = (e) => {
        switch (e.key) {
        case 'Escape':
          if (isOpen) {
            setIsOpen(false);
            e.preventDefault();
          }
          break;
        }
      };
      window.addEventListener('keydown', onKeyDown);
      return () => {
        console.debug('unsub - escape');
        window.removeEventListener('keydown', onKeyDown);
      };
    }
  }, [isOpen]);

  const actionHandler = useCallback(async (action, eventOptions) => {
    setIsOpen(false);

    console.log('HANDLING ACTION!', action, eventOptions);
    if (action.action === 'history' && action.url) {
      handleAction(action, eventOptions);
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
      handleAction(action, eventOptions);
    }
  }, []);

  return html`<${MainApp} showing=${isOpen} handleAction=${actionHandler} />`;
}

export function renderElement() {
  const div = document.createElement('div');
  div.id = 'omni-launcher-extension-wrapper';
  div.style.position ='absolute';
  div.style.top = '0';
  div.style.left = '0';
  div.attachShadow({mode:'open'});
  document.body.appendChild(div);

  // <link rel="stylesheet" href="https://dev.to/assets/crayons-7870bae01e6b6faa36fdd09d45db8386c7fbdd6a6823dd54f8c94a6c936abd06.css" media="all" id="main-crayons-stylesheet">
  const linkTag = document.createElement('link');
  linkTag.rel='stylesheet';
  linkTag.type='text/css';
  const url = browser.runtime.getURL('content.css');
  linkTag.href = url;
  div.shadowRoot.appendChild(linkTag);
  // document.appendChild(div);
  // document.head.after(div);
  // document.insertBefore(div, document.body);
  
  render(html`<${App} />`, div.shadowRoot);
}