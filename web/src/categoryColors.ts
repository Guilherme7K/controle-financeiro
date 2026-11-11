import type { CategoryTotal } from '../../shared/types';

// Tons terrosos e discretos, como lápis de cor sobre papel.
const palette = [
  '#2c4f86',
  '#b5762a',
  '#4f7a52',
  '#a33b2c',
  '#6b5b95',
  '#3f7f86',
  '#8a5a44',
  '#7d7f3a',
];

export function buildCategoryColors(items: CategoryTotal[]): Map<string, string> {
  return new Map(
    items.map((item, index) => [item.category, palette[index % palette.length]]),
  );
}
