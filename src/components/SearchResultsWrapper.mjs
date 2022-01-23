import {
  html,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "../standalone.mjs";
import OmniItem from "./OmniItem.mjs";

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
