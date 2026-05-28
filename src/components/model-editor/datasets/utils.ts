/**
 * Generates all possible combinations of categories across multiple dimensions.
 * For example, given {x: ['a', 'b'], y: ['c'], z: ['d', 'e']},
 * returns [['a','c','d'], ['a','c','e'], ['b','c','d'], ['b','c','e']]
 */
export function getCategoryCombinations(selectedCategories: {
  [dimensionKey: string]: string[];
}): string[][] {
  const nonEmpty = Object.fromEntries(
    Object.entries(selectedCategories).filter(([, cats]) => cats.length > 0)
  );
  const arrays = Object.values(nonEmpty);

  if (arrays.length === 0) return [];
  if (arrays.length === 1) return arrays[0].map((cat) => [cat]);

  const first = arrays[0];
  const remaining = getCategoryCombinations(Object.fromEntries(Object.entries(nonEmpty).slice(1)));

  return first.flatMap((cat) => remaining.map((combo) => [cat, ...combo]));
}
