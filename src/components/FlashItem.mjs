import { html, useCallback, useEffect, useRef } from "../lib/htm-preact-standalone.mjs";
import classNames from "../utils/classNames.mjs";

export default function FlashItem({
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
    keys = html`<div class="flash-keys">
      ${action.keys.map(function (key) {
        return html`<span key=${key} key=${key} class="flash-shortcut"
          >${key}</span
        >`;
      })}
    </div>`;
  }
  const imgUrl =
    action.favIconUrl || browser.runtime.getURL("/assets/globe.svg");
  const img = html`<img
    src="${imgUrl}"
    class="flash-icon"
    alt="${action.title}"
  />`;
  const emoji = action.emoji
    ? html`<span class="flash-emoji-action">${action.emojiChar}</span>`
    : null;
  const missingPermissions = action.hasPermission === false;

  const incognitoIcon =
    action.incognito === true
      ? html`<img
          src="${browser.runtime.getURL("/assets/incognito.svg")}"
          class="incognito"
        />`
      : null;

  return html`<a
    ref=${ref}
    key=${action.id || action.url || action.action}
    class=${classNames(
      "flash-item",
      isSelected && "flash-item-active",
      action.incognito && "incognito"
    )}
    data-type="${action.type}"
    data-icon="${action.favIconUrl}"
    data-url="${action.url}"
    onClick=${handleClick}
    onMouseenter=${onMouseEnter}
  >
    ${emoji || img}
    <div class="flash-item-details">
      <div class="flash-item-name">
        ${action.title}
        ${action.shortcut &&
        html`<span class="shortcut">${action.shortcut}</span>`}
      </div>
      <div class="flash-item-desc">
        ${action.desc || action.searchPrefix} ${incognitoIcon}
        ${action.url && html` <span class="url">(${action.url})</span>`}
      </div>
    </div>
    ${keys}
    <div class="flash-select ${missingPermissions && "needs-permission"}">
      ${missingPermissions
        ? html`Allow this action ➤`
        : html`${selectVerb} <span class="flash-shortcut">⏎</span>`}
    </div>
  </a>`;
}
