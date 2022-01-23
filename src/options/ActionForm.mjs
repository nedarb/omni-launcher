import { html, useCallback, useState } from "../standalone.mjs";

/**
 * @type {Array<{name: string;
 * required?: boolean;
 * label: string;
 * derived?:(action:import("../global.js").Action) => boolean}>}
 */
const ActionFields = [
  { name: "title", label: "Title", required: true },
  { name: "desc", label: "Description", required: true },
  { name: "type", label: "Type" },
  { name: "action", label: "Action", required: true },
  {
    name: "emoji",
    label: "Has emoji?",
    derived: ({ emojiChar }) => !!emojiChar,
  },
  { name: "emojiChar", label: "Emoji character" },
  { name: "url", label: "Has keys?", required: true },
  { name: "favIconUrl", label: "Icon URL" },
];

function Input({ label, name, value, onChange }) {
  return html`<label
    ><span>${label}:</span>
    <input
      name="${name}"
      type="text"
      value="${value}"
      onInput=${onChange}
      required="required"
  /></label>`;
}

export default function ActionForm({ action, onDraftAction }) {
  const [draftAction, setDraftAction] = useState({ ...action });
  console.log(`action`, action);
  const hasUnsavedChanges =
    JSON.stringify(action) !== JSON.stringify(draftAction);
  const handleFieldChange = useCallback(
    (e) => {
      const inputEl = e.target;
      const { name, value } = inputEl;
      const newDraftAction = { ...draftAction, [name]: value };
      onDraftAction && onDraftAction(newDraftAction);
      setDraftAction(newDraftAction);
    },
    [action, draftAction, onDraftAction]
  );
  const handleReset = (e) => {
    e.preventDefault();
    onDraftAction && onDraftAction(action);
    setDraftAction({ ...action });
  };
  return html`<form>
    Action: ${action.action}
    ${action.favIconUrl &&
    html`<img src=${action.favIconUrl} width="16" height="16" />`}
    <${Input}
      label="Title"
      name="title"
      value=${draftAction.title}
      onChange=${handleFieldChange}
    />
    <${Input}
      label="Description"
      name="desc"
      value=${draftAction.desc}
      onChange=${handleFieldChange}
    />
    <${Input}
      label="Url"
      name="url"
      value=${draftAction.url}
      onChange=${handleFieldChange}
    />
    <${Input}
      label="Fav. icon URL"
      name="favIconUrl"
      value=${draftAction.favIconUrl}
      onChange=${handleFieldChange}
    />
    ${hasUnsavedChanges &&
    html`<input type="submit" value="Save" /><input
        type="reset"
        value="Revert"
        onClick=${handleReset}
      />`}
  </form>`;
}
