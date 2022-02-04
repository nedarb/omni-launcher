import {bySelector, inverse, chain} from '../sorters.mjs';

const testArray = [
  {a: 4, b: 1, bool: true}, 
  {a: 2, b: 1, bool: false}, 
  {a: 1, b: 10, bool: true}
];

test('sorting by selector', ()=>{
  const sorted = [...testArray].sort(bySelector(n=>n.a));
  expect(sorted.map(n=>n.a)).toEqual([1,2,4]);
});

test('chained sorting', ()=>{
  const sorted = [...testArray].sort(chain(inverse(bySelector(n=>n.b)), bySelector(n=>n.a)));
  expect(sorted).toEqual([testArray[2], testArray[1], testArray[0]]);
});

test('by boolean', ()=>{
  const sorted = [...testArray].sort(bySelector(n=>n.bool));
  expect(sorted).toEqual([testArray[1], testArray[0], testArray[2]]);
});