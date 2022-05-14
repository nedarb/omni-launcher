import {
  html,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from '../lib/htm-preact-standalone.mjs';
import classNames from '../utils/classNames.mjs';
import OmniItem from './OmniItem.mjs';

function SearchResults({
  actions,
  handleAction,
  onOverItem,
  selectedIndex,
  selectVerb = 'Select',
  footer
}) {
  const sliced = useMemo(() => actions.slice(0, 250), [actions]);
  const total = actions.length;
  // console.log(`SearchResults`, actions, handleAction);
  const list =
    Array.isArray(actions) &&
    sliced.map(function (action, index) {
      return html`<${OmniItem}
        key=${action.id || action.url || action.action}
        index=${index}
        action=${action}
        onOverItem=${onOverItem}
        isSelected=${index === selectedIndex}
        selectVerb=${selectVerb}
        handleAction=${handleAction}
      />`;
    });

  const listCmp = list.length >0 ?list : html`<span>No results</span>`;

  return html`<div class="search-results body">
    <div id="omni-list" class="${classNames('omni-list', list.length === 0 && 'empty')}">${listCmp}</div>
    <div id="omni-footer">
      <div id="omni-results">
        ${list.length}${list.length < total ? '+' : ''} results ${footer}
      </div>
      <div id="omni-arrows">
        Use arrow keys <span class="omni-shortcut">↑</span
        ><span class="omni-shortcut">↓</span> to navigate
      </div>
    </div>
  </div>`;
}

export default function SearchResultsWrapper({
  actions,
  handleAction,
  selectVerb = 'Select',
  footer
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  useEffect(() => {
    // console.log(`actions changed`);
    setSelectedIndex(0);
  }, [actions]);
  useEffect(() => {
    if (
      actions.length > 0 &&
      (selectedIndex >= actions.length || isNaN(selectedIndex))
    ) {
      setSelectedIndex(actions.length - 1);
    }

    function handler(e) {
      const len = actions.length;
      switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((i) => Math.max(0, i - 1));
        break;
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((i) => Math.min(len > 0 ? len - 1 : 0, i + 1));
        break;
      case 'Enter':{
        e.preventDefault();
        const action = actions[selectedIndex];
        handleAction && handleAction(action, { metaKey: e.metaKey });
        break;
      }
      }
    }
    window.addEventListener('keydown', handler);
    return () => {
      // console.debug("unsub");
      window.removeEventListener('keydown', handler);
    };
  }, [selectedIndex, actions, handleAction]);

  const onOverItem = useCallback(
    (newIndex) => setSelectedIndex(newIndex),
    [actions]
  );

  return html`<${SearchResults}
      actions=${actions}
      handleAction=${handleAction}
      selectedIndex=${selectedIndex}
      selectVerb=${selectVerb}
      onOverItem=${onOverItem}
      footer=${footer}
    />`;
}
