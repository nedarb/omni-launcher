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

function Input({ label, name, value, pattern, onChange }) {
  return html`<label
    ><span>${label}:</span>
    <input
      name="${name}"
      type="text"
      value="${value}"
      onInput=${onChange}
      pattern="${pattern}"
      required="required"
  /></label>`;
}

function areObjsEqual(obj1, obj2) {
  if (typeof obj1 === "object" && !Array.isArray(obj1)) {
    const toArray = (o) =>
      Object.keys(o)
        .sort()
        .map((key) => [key, o[key]]);
    return areObjsEqual(toArray(obj1), toArray(obj2));
  }

  return JSON.stringify(obj1) === JSON.stringify(obj2);
}

export default function ActionForm({
  action,
  onDraftAction,
  onSave,
  onDelete,
}) {
  const [draftAction, setDraftAction] = useState({ ...action });
  const hasUnsavedChanges = !areObjsEqual(action, draftAction);
  const handleFieldChange = useCallback(
    (e) => {
      const inputEl = e.target;
      const { name, value } = inputEl;
      const newDraftAction = { ...draftAction, [name]: value };
      if (!value) {
        delete newDraftAction[name];
      }
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
  const handleSubmit = (e) => {
    e.preventDefault();
    // const formEl = e.target;
    // save draft action
    onSave && onSave(draftAction);
  };
  const handleDelete = (e) => {
    e.preventDefault();
    if (
      confirm(
        `Are you sure you want to remove custom search action ${action.title}?`
      )
    ) {
      onDelete && onDelete(action);
    }
  };
  return html`<form onSubmit=${handleSubmit}>
    Action: ${action.action}
    <${Input}
      label="Title"
      name="title"
      value=${draftAction.title}
      onChange=${handleFieldChange}
      required="required"
    />
    <${Input}
      label="Shortcut"
      name="shortcut"
      value=${draftAction.shortcut}
      onChange=${handleFieldChange}
      pattern="[\\w\\d\\.-]+"
      required="required"
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
    <span class="buttons">
      ${hasUnsavedChanges &&
    html`<input type="submit" value="Save" /><input
          type="reset"
          value="Revert"
          onClick=${handleReset}
        />`}
        <button onClick=${handleDelete}>Delete</button>
    </span>
  </form>`;
}
