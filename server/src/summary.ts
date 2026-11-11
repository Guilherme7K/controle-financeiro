import type { Summary, Transaction } from '../../shared/types';

// Regra de negócio isolada em uma função pura: fácil de testar sem subir servidor.
export function summarize(
  transactions: Transaction[],
  month: string | null = null,
): Summary {
  let incomeCents = 0;
  let expenseCents = 0;
  const byCategory = new Map<string, number>();

  for (const t of transactions) {
    if (t.type === 'income') {
      incomeCents += t.amountCents;
    } else {
      expenseCents += t.amountCents;
      byCategory.set(t.category, (byCategory.get(t.category) ?? 0) + t.amountCents);
    }
  }

  const expensesByCategory = [...byCategory.entries()]
    .map(([category, totalCents]) => ({ category, totalCents }))
    .sort((a, b) => b.totalCents - a.totalCents);

  return {
    month,
    incomeCents,
    expenseCents,
    balanceCents: incomeCents - expenseCents,
    expensesByCategory,
  };
}
