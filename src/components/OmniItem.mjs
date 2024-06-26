/**
 * @typedef { import("../@types/global").Action } Action
 */
import {
  html,
  useCallback,
  useEffect,
  useRef,
  useState,
} from '../lib/htm-preact-standalone.mjs';
import classNames from '../utils/classNames.mjs';

/**
 * @typedef {(action: Action) => any} ActionCallback
 * @param {{
 *  action: Action;
 *  index: number;
 *  isSelected: boolean;
 *  selectVerb: string;
 *  handleAction: ActionCallback;
 *  onOverItem: (index: number) => any
 * }} props
 * @returns
 */
export default function OmniItem({
  action,
  index,
  handleAction,
  onOverItem,
  isSelected,
  selectVerb = 'Select',
}) {
  const imgUrl =
    action.favIconUrl || browser.runtime.getURL('/assets/globe.svg');
  const [showImg, setShowImg] = useState(true);
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
  const onImgError =useCallback((err)=>{
    console.warn(err);
    setShowImg(false);
  },[imgUrl]);
  useEffect(() => {
    if (isSelected) {
      ref?.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
  }, [ref, isSelected]);
  var keys = '';
  if (action.keycheck) {
    keys = html`<div class="omni-keys">
      ${action.keys.map(function (key) {
    return html`<span key=${key} key=${key} class="omni-shortcut"
          >${key}</span
        >`;
  })}
    </div>`;
  }
  const img = showImg ? html`<img
    src="${imgUrl}"
    class="omni-icon"
    alt="${action.title}"
    onerror=${onImgError}
  />`: null;
  const emoji = action.emoji
    ? html`<span class="omni-emoji-action">${action.emojiChar}</span>`
    : null;
  const missingPermissions = action.hasPermission === false;

  const incognitoIcon =
    action.incognito === true
      ? html`<img
          src="${browser.runtime.getURL('/assets/incognito.svg')}"
          class="incognito"
        />`
      : null;

  return html`<a
    ref=${ref}
    key=${action.id || action.url || action.action}
    class=${classNames(
    'omni-item',
    isSelected && 'omni-item-active',
    action.incognito && 'incognito'
  )}
    data-type="${action.type}"
    data-icon="${action.favIconUrl}"
    data-url="${action.url}"
    onClick=${handleClick}
    onMouseenter=${onMouseEnter}
  >
    <span class="icon ${classNames(img && 'favIcon', emoji && 'emoji')}">
      ${img}
      ${emoji}
    </span>
    <div class="omni-item-details">
      <div class="omni-item-name">
      ${action.shortcut &&
        html`<span class="shortcut">${action.shortcut}</span>`}
        ${action.title}
        ${action.isDuplicate && html`<span class="duplicate">(duplicate)</span>`}
      </div>
      <div class="omni-item-desc">
        ${action.desc || action.searchPrefix} ${incognitoIcon}
        ${action.url && html` <span class="url">(${action.url})</span>`}
      </div>
    </div>
    ${keys}
    <div class="omni-select ${missingPermissions && 'needs-permission'}">
      ${missingPermissions
    ? html`Allow this action ➤`
    : html`${selectVerb} <span class="omni-shortcut">⏎</span>`}
    </div>
  </a>`;
}
