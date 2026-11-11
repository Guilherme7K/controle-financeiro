import { describe, expect, it } from 'vitest';
import type { Transaction } from '../../shared/types';
import { summarize } from '../src/summary';

function tx(partial: Partial<Transaction>): Transaction {
  return {
    id: crypto.randomUUID(),
    description: 'Teste',
    amountCents: 1000,
    type: 'expense',
    category: 'Geral',
    date: '2026-11-10',
    createdAt: '2026-11-10T12:00:00.000Z',
    ...partial,
  };
}

describe('summarize', () => {
  it('retorna zeros quando não há lançamentos', () => {
    expect(summarize([])).toEqual({
      month: null,
      incomeCents: 0,
      expenseCents: 0,
      balanceCents: 0,
      expensesByCategory: [],
    });
  });

  it('soma entradas e saídas e calcula o saldo', () => {
    const summary = summarize(
      [
        tx({ type: 'income', amountCents: 500000 }),
        tx({ type: 'expense', amountCents: 120050 }),
        tx({ type: 'expense', amountCents: 9950 }),
      ],
      '2026-11',
    );

    expect(summary.month).toBe('2026-11');
    expect(summary.incomeCents).toBe(500000);
    expect(summary.expenseCents).toBe(130000);
    expect(summary.balanceCents).toBe(370000);
  });

  it('agrupa despesas por categoria, da maior para a menor, ignorando entradas', () => {
    const summary = summarize([
      tx({ category: 'Lazer', amountCents: 3000 }),
      tx({ category: 'Moradia', amountCents: 150000 }),
      tx({ category: 'Lazer', amountCents: 2000 }),
      tx({ type: 'income', category: 'Salário', amountCents: 999999 }),
    ]);

    expect(summary.expensesByCategory).toEqual([
      { category: 'Moradia', totalCents: 150000 },
      { category: 'Lazer', totalCents: 5000 },
    ]);
  });
});
