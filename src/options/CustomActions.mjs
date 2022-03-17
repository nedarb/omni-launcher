/**
 * @typedef { import("../global").Action } Action
 */

import {
  html,
  useState,
  useEffect,
  useCallback,
} from '../lib/htm-preact-standalone.mjs';
import {
  getCustomActions,
  upsertCustomAction,
  deleteAction,
} from '../services/customActions.mjs';
import OmniItem from '../components/OmniItem.mjs';
import ActionForm from './ActionForm.mjs';
import { byStringSelector } from '../utils/sorters.mjs';

/*
      title: "New tab",
      desc: "Open a new tab",
      type: "action",
      action: "new-tab",
      emoji: true,
      emojiChar: "✨",
      keycheck: true,
      keys: ["⌘", "T"],
*/

/**
 *
 * @param { { action: Action; onSave: (action: Action)=>any; onDelete: (action: Action)=>any }} props
 * @returns
 */
function CustomSearch({ action, onSave, onDelete }) {
  const [draft, setDraft] = useState(action);
  const onDraftAction = useCallback(
    (draftAction) => {
      setDraft(draftAction);
    },
    [action]
  );
  return html`<div class="custom-action card">
    <${ActionForm}
      action=${action}
      onDraftAction=${onDraftAction}
      onSave=${onSave}
      onDelete=${onDelete}
    />
    <div class="preview">
      Preview:
      <${OmniItem} action=${draft} />
    </div>
  </div>`;
}

export default function CustomActions() {
  const [actions, setActions] = useState([]);
  useEffect(() => {
    getCustomActions().then((r) => setActions(r));
  }, []);

  const onSave = useCallback(
    async (draftAction) => {
      console.info('saving action', draftAction);
      const actionsAfterUpsert = await upsertCustomAction(draftAction);
      setActions(actionsAfterUpsert);
    },
    [actions]
  );

  const onDelete = useCallback(
    async (action) => {
      console.debug(`deleting custom action ${action.title}`);
      setActions(await deleteAction(action));
    },
    [actions]
  );

  return html`<div>
    <h2>Custom actions:</h2>
    ${actions
    .sort(byStringSelector((action) => action.title))
    .map(
      (a) =>
        html`<${CustomSearch}
            key=${a.url}
            action=${a}
            onSave=${onSave}
            onDelete=${onDelete}
          />`
    )}
  </div>`;
}
