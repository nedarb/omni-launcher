import {
  html,
  render,
  useState,
  useEffect,
  useCallback,
} from "../standalone.mjs";
import {
  getCustomActions,
  addCustomAction,
  upsertCustomAction,
  deleteAction,
} from "../services/customActions.mjs";
import OmniItem from "../components/OmniItem.mjs";
import ActionForm from "./ActionForm.mjs";

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

function CustomSearch({ action, onSave, onDelete }) {
  const [draft, setDraft] = useState(action);
  const onDraftAction = useCallback(
    (draftAction) => {
      setDraft(draftAction);
    },
    [action]
  );
  return html`<div class="custom-action">
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
  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      const formValues = Array.from(e.target.querySelectorAll("input[name]"))
        .map((el) => ({ name: el.name, value: el.value }))
        .reduce(
          (map, { name, value }) => {
            if (name === "name") {
              map.title = map.desc = value;
            } else if (name === "emoji" && value) {
              map.emojiChar = value;
              map.emoji = true;
            } else {
              map[name] = value;
            }
            return map;
          },
          { type: "action" }
        );
      if (formValues) {
        setActions(await addCustomAction(formValues));
      }
    },
    [actions]
  );

  const onSave = useCallback(
    async (draftAction) => {
      console.info(`saving action`, draftAction);
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
    ${actions.map(
      (a) =>
        html`<${CustomSearch}
          key=${a.url}
          action=${a}
          onSave=${onSave}
          onDelete=${onDelete}
        />`
    )}
    <form onSubmit=${handleSubmit}>
      <div>Name: <input name="name" type="text" value="MDN" /></div>
      <div>
        Emoji icon:
        <input
          name="emoji"
          type="text"
          value="✨"
          minlength="0"
          maxlength="3"
        />
      </div>
      <div>
        Fav icon URL:
        <input
          name="favIconUrl"
          type="text"
          value="https://developer.mozilla.org/favicon-48x48.97046865.png"
          minlength="0"
          maxlength="3"
        />
      </div>
      <div>
        URL:
        <input name="url" type="text" value="https://developer.mozilla.org/" />
      </div>
      <input type="submit" value="Add" />
    </form>
    <pre>${JSON.stringify(actions, null, 2)}</pre>
  </div>`;
}
