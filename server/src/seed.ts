import { randomUUID } from 'node:crypto';
import type { NewTransaction, Transaction } from '../../shared/types';

// Dados de exemplo no mês atual para a conta de demonstração.
export function seedTransactions(now = new Date()): Transaction[] {
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const day = (d: number) => `${month}-${String(d).padStart(2, '0')}`;

  const samples: NewTransaction[] = [
    {
      description: 'Salário',
      amountCents: 650000,
      type: 'income',
      category: 'Salário',
      date: day(5),
    },
    {
      description: 'Freelance landing page',
      amountCents: 120000,
      type: 'income',
      category: 'Freelance',
      date: day(8),
    },
    {
      description: 'Aluguel',
      amountCents: 180000,
      type: 'expense',
      category: 'Moradia',
      date: day(6),
    },
    {
      description: 'Supermercado',
      amountCents: 64250,
      type: 'expense',
      category: 'Alimentação',
      date: day(7),
    },
    {
      description: 'Conta de luz',
      amountCents: 18990,
      type: 'expense',
      category: 'Moradia',
      date: day(8),
    },
    {
      description: 'Uber',
      amountCents: 4380,
      type: 'expense',
      category: 'Transporte',
      date: day(9),
    },
    {
      description: 'Streaming',
      amountCents: 5590,
      type: 'expense',
      category: 'Lazer',
      date: day(9),
    },
  ];

  return samples.map((sample) => ({
    ...sample,
    id: randomUUID(),
    createdAt: now.toISOString(),
  }));
}
