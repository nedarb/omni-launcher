/**
 * @typedef { import("../@types/global").Action } Action
 */

import { html, useCallback, useState } from '../lib/htm-preact-standalone.mjs';

function Input({ label, name, value, pattern, onChange, onRevert }) {
  const onKeyPress = ({target, key})=>{
    if (key === 'Escape') {
      onRevert({ target });
    }
  };
  return html`<label
    ><span>${label}:</span>
    <input
      name="${name}"
      type="text"
      value="${value}"
      onInput=${onChange}
      onKeyUp=${onKeyPress}
      pattern="${pattern}"
      required="required"
  /></label>`;
}

function areObjsEqual(obj1, obj2) {
  if (typeof obj1 === 'object' && !Array.isArray(obj1)) {
    const toArray = (o) =>
      Object.keys(o)
        .sort()
        .map((key) => [key, o[key]]);
    return areObjsEqual(toArray(obj1), toArray(obj2));
  }

  return JSON.stringify(obj1) === JSON.stringify(obj2);
}

/**
 * @param { { action: Action; onDraftAction: (action: Action)=>any; onSave: (action: Action)=>any; onDelete: (action: Action)=>any } } props
 * @returns
 */
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
  const handleFieldReset = useCallback(
    (e) => {
      const {name} = e.target;
      const newDraftAction = { ...draftAction, [name]: action[name] };
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
    <${Input}
      label="Title"
      name="title"
      value=${draftAction.title}
      onChange=${handleFieldChange}
      onRevert=${handleFieldReset}
      required="required"
    />
    <${Input}
      label="Shortcut"
      name="shortcut"
      value=${draftAction.shortcut}
      onChange=${handleFieldChange}
      onRevert=${handleFieldReset}
      pattern="[\\w\\d\\.-]+"
      required="required"
    />
    <${Input}
      label="Description"
      name="desc"
      value=${draftAction.desc}
      onChange=${handleFieldChange}
      onRevert=${handleFieldReset}
    />
    <${Input}
      label="Url"
      name="url"
      value=${draftAction.url}
      onChange=${handleFieldChange}
      onRevert=${handleFieldReset}
    />
    <${Input}
      label="Fav. icon URL"
      name="favIconUrl"
      value=${draftAction.favIconUrl}
      onChange=${handleFieldChange}
      onRevert=${handleFieldReset}
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
