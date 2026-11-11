// Contrato entre o back-end e o front-end.
// Os dois lados importam estes tipos (apenas como `import type`), então
// se a API mudar, o TypeScript acusa o erro no front em tempo de compilação.

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  description: string;
  /** Valor em centavos (inteiro) para evitar erros de ponto flutuante. */
  amountCents: number;
  type: TransactionType;
  category: string;
  /** Data no formato YYYY-MM-DD. */
  date: string;
  /** Data/hora de criação em ISO 8601. */
  createdAt: string;
}

export type NewTransaction = Omit<Transaction, 'id' | 'createdAt'>;

export interface CategoryTotal {
  category: string;
  totalCents: number;
}

export interface Summary {
  /** Mês filtrado (YYYY-MM) ou null quando considera todos os lançamentos. */
  month: string | null;
  incomeCents: number;
  expenseCents: number;
  balanceCents: number;
  /** Despesas agrupadas por categoria, da maior para a menor. */
  expensesByCategory: CategoryTotal[];
}

export interface ApiError {
  error: string;
  issues?: { path: string; message: string }[];
}

export interface User {
  id: string;
  name: string;
  email: string;
}
export interface AuthResponse {
  token: string;
  user: User;
}
export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}
export interface LoginInput {
  email: string;
  password: string;
}
export interface Budget {
  category: string;
  limitCents: number;
}
