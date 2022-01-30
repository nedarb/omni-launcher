import { useEffect, useState } from "../lib/htm-preact-standalone.mjs";

export default function useAsyncState(
  generator,
  defaultValue,
  dependencies = []
) {
  const [value, setValue] = useState(defaultValue);
  useEffect(() => {
    let valid = true;
    generator(...dependencies).then((val) => valid && setValue(val));
    return () => (valid = false);
  }, dependencies);
  return value;
}
