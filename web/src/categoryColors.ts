import type { CategoryTotal } from '../../shared/types';

const palette = [
  '#2f8f6b',
  '#e0a23b',
  '#4f7cc4',
  '#c8553d',
  '#8a6fbf',
  '#4fa7a1',
  '#b0637f',
  '#7d8c3c',
];

export function buildCategoryColors(items: CategoryTotal[]): Map<string, string> {
  return new Map(
    items.map((item, index) => [item.category, palette[index % palette.length]]),
  );
}
