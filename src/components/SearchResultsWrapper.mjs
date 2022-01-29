import {
  html,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "../standalone.mjs";
import FlashItem from "./FlashItem.mjs";

function SearchResults({
  actions,
  handleAction,
  onOverItem,
  selectedIndex,
  selectVerb = "Select",
}) {
  const sliced = useMemo(() => actions.slice(0, 250), [actions]);
  const total = actions.length;
  // console.log(`SearchResults`, actions, handleAction);
  const list =
    Array.isArray(actions) &&
    sliced.map(function (action, index) {
      return html`<${FlashItem}
        key=${action.id || action.url || action.action}
        index=${index}
        action=${action}
        onOverItem=${onOverItem}
        isSelected=${index === selectedIndex}
        selectVerb=${selectVerb}
        handleAction=${handleAction}
      />`;
    });

  return html`<div class="search-results">
    <div id="flash-list">${list}</div>
    <div id="flash-footer">
      <div id="flash-results">
        ${list.length}${list.length < total ? "+" : ""} results
      </div>
      <div id="flash-arrows">
        Use arrow keys <span class="flash-shortcut">↑</span
        ><span class="flash-shortcut">↓</span> to navigate
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
          e.preventDefault();
          setSelectedIndex((i) => Math.max(0, i - 1));
          break;
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((i) => Math.min(len > 0 ? len - 1 : 0, i + 1));
          break;
        case "Enter":
          e.preventDefault();
          const action = actions[selectedIndex];
          handleAction && handleAction(action, { metaKey: e.metaKey });
          break;
      }
    }
    window.addEventListener("keydown", handler);
    return () => {
      // console.debug("unsub");
      window.removeEventListener("keydown", handler);
    };
  }, [selectedIndex, actions, handleAction]);

  const onOverItem = useCallback(
    (newIndex) => setSelectedIndex(newIndex),
    [actions]
  );

  return html`<div class="search-results-wrapper">
    <${SearchResults}
      actions=${actions}
      handleAction=${handleAction}
      selectedIndex=${selectedIndex}
      selectVerb=${selectVerb}
      onOverItem=${onOverItem}
    />
  </div>`;
}
