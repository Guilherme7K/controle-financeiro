import type { CategoryTotal, Transaction } from '../../shared/types';

export function buildDonutSegments(items: CategoryTotal[], total: number) {
  const circumference = 2 * Math.PI * 46;
  let offset = 0;
  return items.map((item) => {
    // Cada arco ocupa a fração correspondente da circunferência; o deslocamento acumula os arcos anteriores.
    const length = total > 0 ? (item.totalCents / total) * circumference : 0;
    const segment = { category: item.category, length, offset, circumference };
    offset += length;
    return segment;
  });
}

export function dailyExpenses(transactions: Transaction[], month: string): number[] {
  const [year, monthNumber] = month.split('-').map(Number);
  const totals = Array.from(
    { length: new Date(year, monthNumber, 0).getDate() },
    () => 0,
  );
  for (const item of transactions) {
    if (item.type === 'expense' && item.date.startsWith(`${month}-`)) {
      const day = Number(item.date.slice(8, 10));
      if (day >= 1 && day <= totals.length) totals[day - 1] += item.amountCents;
    }
  }
  return totals;
}
