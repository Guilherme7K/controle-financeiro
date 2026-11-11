import type { TransactionType } from '../../shared/types';

// Sugestões de categoria. São só atalhos: a pessoa pode digitar qualquer outra.
export const expenseCategories = [
  'Alimentação',
  'Moradia',
  'Transporte',
  'Saúde',
  'Lazer',
  'Outros',
];

export const incomeCategories = [
  'Salário',
  'Freelance',
  'Investimentos',
  'Vendas',
  'Reembolso',
  'Outros',
];

export function categoriesFor(type: TransactionType): string[] {
  return type === 'income' ? incomeCategories : expenseCategories;
}
