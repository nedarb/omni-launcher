import {
  html,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "../standalone.mjs";

function OmniItem({
  action,
  index,
  handleAction,
  isSelected,
  selectVerb = "Select",
}) {
  const ref = useRef(null);
  const handleClick = useCallback(
    (e) => {
      e.preventDefault(true);
      handleAction && handleAction(action, e);
    },
    [action, handleAction]
  );
  useEffect(() => {
    if (isSelected) {
      ref?.current?.scrollIntoView({ block: "nearest", inline: "nearest" });
    }
  }, [ref, isSelected]);
  var keys = "";
  if (action.keycheck) {
    keys = html`<div class="omni-keys">
      ${action.keys.map(function (key) {
        return html`<span key=${key} key=${key} class="omni-shortcut"
          >${key}</span
        >`;
      })}
    </div>`;
  }
  const imgUrl =
    action.favIconUrl || browser.runtime.getURL("/assets/globe.svg");
  const img = html`<img
    src="${imgUrl}"
    class="omni-icon"
    alt="${action.title}"
  />`;
  const emoji = action.emoji
    ? html`<span class="omni-emoji-action">${action.emojiChar}</span>`
    : null;

  return html`<a
    ref=${ref}
    key=${action.id || action.url || action.action}
    class="omni-item ${isSelected ? "omni-item-active" : ""}"
    data-type="${action.type}"
    data-icon="${action.favIconUrl}"
    data-url="${action.url}"
    onClick=${handleClick}
  >
    ${emoji || img}
    <div class="omni-item-details">
      <div class="omni-item-name">${action.title}</div>
      <div class="omni-item-desc">${action.url || action.searchPrefix}</div>
    </div>
    ${keys}
    <div class="omni-select">
      ${selectVerb} <span class="omni-shortcut">⏎</span>
    </div>
  </a>`;
}

function SearchResults({
  actions,
  handleAction,
  selectedIndex,
  selectVerb = "Select",
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
        isSelected=${index === selectedIndex}
        selectVerb=${selectVerb}
        handleAction=${handleAction}
      />`;
    });

  return html`<div class="search-results">
    <div id="omni-list">${list}</div>
    <div id="omni-footer">
      <div id="omni-results">
        ${list.length}${list.length < total ? "+" : ""} results
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
  selectVerb = "Select",
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
        case "ArrowUp":
          setSelectedIndex((i) => Math.max(0, i - 1));
          break;
        case "ArrowDown":
          setSelectedIndex((i) => Math.min(len > 0 ? len - 1 : 0, i + 1));
          break;
        case "Enter":
          const action = actions[selectedIndex];
          handleAction && handleAction(action, { metaKey: e.metaKey });
          break;
        // case "Escape":
        //   handleAction && handleAction({ action: CloseOmniAction });
        //   break;
      }
    }
    window.addEventListener("keydown", handler);
    return () => {
      // console.debug("unsub");
      window.removeEventListener("keydown", handler);
    };
  }, [selectedIndex, actions, handleAction]);

  return html`<div class="search-results-wrapper">
    <${SearchResults}
      actions=${actions}
      handleAction=${handleAction}
      selectedIndex=${selectedIndex}
      selectVerb=${selectVerb}
    />
  </div>`;
}
