export function byStringSelector(selector) {
  return (a, b) => selector(a).localeCompare(selector(b));
}

export function bySelector(selector) {
  return (a,b) => selector(a) - selector(b);
}

export function inverse(sortFn) {
  return (a,b)=>-sortFn(a,b);
}

export function chain(...sorters) {
  return (a,b)=>{
    for (const sorter of sorters) {
      const result = sorter(a,b);
      if (result !== 0) {
        return result;
      }
    }
    return 0;
  };
}