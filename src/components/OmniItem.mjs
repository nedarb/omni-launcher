import { html, useCallback, useEffect, useRef } from "../standalone.mjs";

export default function OmniItem({
  action,
  index,
  handleAction,
  onOverItem,
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
  const onMouseEnter = useCallback(
    () => onOverItem && onOverItem(index),
    [index]
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
    onMouseenter=${onMouseEnter}
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