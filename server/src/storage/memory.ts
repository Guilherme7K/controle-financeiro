import { randomUUID } from 'node:crypto';
import type { Budget, NewTransaction, Transaction } from '../../../shared/types';
import type { Storage, StoredUser, UserInput } from './types';

type OwnedTransaction = Transaction & { userId: string };
type OwnedBudget = Budget & { userId: string };
export type MemoryData = {
  users: StoredUser[];
  transactions: OwnedTransaction[];
  budgets: OwnedBudget[];
};

export class MemoryStorage implements Storage {
  protected data: MemoryData;
  constructor(data: MemoryData = { users: [], transactions: [], budgets: [] }) {
    this.data = data;
  }
  async findUserByEmail(email: string) {
    return this.data.users.find((u) => u.email === email.trim().toLowerCase()) ?? null;
  }
  async findUserById(id: string) {
    return this.data.users.find((u) => u.id === id) ?? null;
  }
  async createUser(data: UserInput) {
    const email = data.email.trim().toLowerCase();
    if (this.data.users.some((u) => u.email === email)) throw new Error('EMAIL_EXISTS');
    const user = { ...data, email, id: randomUUID() };
    this.data.users.push(user);
    return user;
  }
  async listTransactions(userId: string, filter: { month?: string } = {}) {
    return this.data.transactions
      .filter(
        (t) =>
          t.userId === userId && (!filter.month || t.date.startsWith(`${filter.month}-`)),
      )
      .sort(
        (a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt),
      )
      .map(({ userId: _userId, ...transaction }) => transaction);
  }
  async createTransaction(userId: string, data: NewTransaction) {
    const transaction = {
      ...data,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
    };
    this.data.transactions.push({ ...transaction, userId });
    return transaction;
  }
  async updateTransaction(userId: string, id: string, data: NewTransaction) {
    const item = this.data.transactions.find((t) => t.userId === userId && t.id === id);
    if (!item) return null;
    Object.assign(item, data);
    const { userId: _userId, ...transaction } = item;
    return transaction;
  }
  async removeTransaction(userId: string, id: string) {
    const index = this.data.transactions.findIndex(
      (t) => t.userId === userId && t.id === id,
    );
    if (index < 0) return false;
    this.data.transactions.splice(index, 1);
    return true;
  }
  async listBudgets(userId: string) {
    return this.data.budgets
      .filter((b) => b.userId === userId)
      .map(({ userId: _userId, ...budget }) => budget);
  }
  async setBudget(userId: string, category: string, limitCents: number) {
    const existing = this.data.budgets.find(
      (b) => b.userId === userId && b.category === category,
    );
    if (existing) existing.limitCents = limitCents;
    else this.data.budgets.push({ userId, category, limitCents });
    return { category, limitCents };
  }
  async removeBudget(userId: string, category: string) {
    const index = this.data.budgets.findIndex(
      (b) => b.userId === userId && b.category === category,
    );
    if (index < 0) return false;
    this.data.budgets.splice(index, 1);
    return true;
  }
}
