import '../lib/webextension-polyfill.js';

import {
  html,
  useState,
  useEffect,
  useCallback,
} from '../lib/htm-preact-standalone.mjs';

import storage from '../common/HostsThatIgnoreHash.mjs';

function Row({ index, value, onUpdate, onRemove }) {
  const cb = (e) => e.key === 'Enter' && onUpdate(index, e.target.value);
  const rm = () => onRemove(index);
  return html`<tr key=${index}>
    <td><input type="text" value="${value}" onKeyUp=${cb} /></td> 
    <td>
      <a onClick=${rm}>[x]</a>
    </td>
  </tr>`;
}

export default function GroupWithoutHash() {
  const [hosts, setHosts] = useState([]);

  useEffect(async () => {
    const values = await storage.getHosts();

    setHosts(values ?? []);
  }, []);

  const updateHost = useCallback((index, value)=>{
    const current = [...hosts];
    current[index] = value;

    setHosts(current);
    storage.update(index, value);
  }, [hosts]);

  const onAddNew = useCallback((e)=>{
    if (e.key === 'Enter') {
      const {value} = e.target;
      console.log('adding ', value);

      const updated = [...hosts, value];
      setHosts(updated);
      storage.add(value);
    }
  }, [hosts]);
  const onRemoved = useCallback(async (index) => {
    const result = await storage.remove(index);

    setHosts(result);
  }, [hosts]);
  
  return html`<div>
    <h2>Group the following domains without hash:</h2>
    <table>
      <tr>
        <th>Host</th>
        <th></th>
      </tr>
      ${hosts &&
      hosts.map(
        (value, i) =>html`<${Row}
            key=${i}
            value=${value}
            index=${i}
            onUpdate=${updateHost}
            onRemove=${onRemoved}
          />`
      )}
      <tr><td><input type="text" value="" placeholder="add new" onKeyUp=${onAddNew} /></td><td></td></tr>
    </table>
  </div>`;
}