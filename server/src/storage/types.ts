import type { Budget, NewTransaction, Transaction, User } from '../../../shared/types';

export type StoredUser = User & { passwordHash: string };
export type UserInput = Pick<StoredUser, 'name' | 'email' | 'passwordHash'>;
export interface Storage {
  findUserByEmail(email: string): Promise<StoredUser | null>;
  findUserById(id: string): Promise<StoredUser | null>;
  createUser(data: UserInput): Promise<StoredUser>;
  listTransactions(userId: string, filter?: { month?: string }): Promise<Transaction[]>;
  createTransaction(userId: string, data: NewTransaction): Promise<Transaction>;
  updateTransaction(
    userId: string,
    id: string,
    data: NewTransaction,
  ): Promise<Transaction | null>;
  removeTransaction(userId: string, id: string): Promise<boolean>;
  listBudgets(userId: string): Promise<Budget[]>;
  setBudget(userId: string, category: string, limitCents: number): Promise<Budget>;
  removeBudget(userId: string, category: string): Promise<boolean>;
}
