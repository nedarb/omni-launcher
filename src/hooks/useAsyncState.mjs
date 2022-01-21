import { useEffect, useState } from "../standalone.mjs";

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
