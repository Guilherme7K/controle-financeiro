import { randomUUID } from 'node:crypto';
import type { Pool } from 'pg';
import type { NewTransaction, Transaction, Budget } from '../../../shared/types';
import type { Storage, StoredUser, UserInput } from './types';

type UserRow = { id: string; name: string; email: string; password_hash: string };
type TransactionRow = {
  id: string;
  description: string;
  amount_cents: number;
  type: Transaction['type'];
  category: string;
  date: string;
  created_at: Date;
};
type BudgetRow = { category: string; limit_cents: number };
function userFromRow(row: UserRow): StoredUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.password_hash,
  };
}
function transactionFromRow(row: TransactionRow): Transaction {
  return {
    id: row.id,
    description: row.description,
    amountCents: row.amount_cents,
    type: row.type,
    category: row.category,
    date: row.date,
    createdAt: row.created_at.toISOString(),
  };
}
function budgetFromRow(row: BudgetRow): Budget {
  return { category: row.category, limitCents: row.limit_cents };
}

export class PostgresStorage implements Storage {
  constructor(private readonly pool: Pool) {}
  async init() {
    await this.pool.query(
      `create table if not exists users (id uuid primary key, name text, email text unique not null, password_hash text, created_at timestamptz default now())`,
    );
    await this.pool.query(
      `create table if not exists transactions (id uuid primary key, user_id uuid references users(id) on delete cascade, description text, amount_cents integer, type text check (type in ('income','expense')), category text, date text, created_at timestamptz default now())`,
    );
    await this.pool.query(
      `create table if not exists budgets (user_id uuid references users(id) on delete cascade, category text, limit_cents integer, primary key (user_id, category))`,
    );
  }
  async findUserByEmail(email: string) {
    const r = await this.pool.query<UserRow>('select * from users where email = $1', [
      email.trim().toLowerCase(),
    ]);
    return r.rows[0] ? userFromRow(r.rows[0]) : null;
  }
  async findUserById(id: string) {
    const r = await this.pool.query<UserRow>('select * from users where id = $1', [id]);
    return r.rows[0] ? userFromRow(r.rows[0]) : null;
  }
  async createUser(data: UserInput) {
    const r = await this.pool.query<UserRow>(
      'insert into users (id, name, email, password_hash) values ($1, $2, $3, $4) returning *',
      [randomUUID(), data.name, data.email.trim().toLowerCase(), data.passwordHash],
    );
    return userFromRow(r.rows[0]!);
  }
  async listTransactions(userId: string, filter: { month?: string } = {}) {
    const r = filter.month
      ? await this.pool.query<TransactionRow>(
          'select * from transactions where user_id = $1 and date like $2 order by date desc, created_at desc',
          [userId, `${filter.month}-%`],
        )
      : await this.pool.query<TransactionRow>(
          'select * from transactions where user_id = $1 order by date desc, created_at desc',
          [userId],
        );
    return r.rows.map(transactionFromRow);
  }
  async createTransaction(userId: string, data: NewTransaction) {
    const r = await this.pool.query<TransactionRow>(
      'insert into transactions (id, user_id, description, amount_cents, type, category, date) values ($1, $2, $3, $4, $5, $6, $7) returning *',
      [
        randomUUID(),
        userId,
        data.description,
        data.amountCents,
        data.type,
        data.category,
        data.date,
      ],
    );
    return transactionFromRow(r.rows[0]!);
  }
  async updateTransaction(userId: string, id: string, data: NewTransaction) {
    const r = await this.pool.query<TransactionRow>(
      'update transactions set description = $3, amount_cents = $4, type = $5, category = $6, date = $7 where user_id = $1 and id = $2 returning *',
      [
        userId,
        id,
        data.description,
        data.amountCents,
        data.type,
        data.category,
        data.date,
      ],
    );
    return r.rows[0] ? transactionFromRow(r.rows[0]) : null;
  }
  async removeTransaction(userId: string, id: string) {
    const r = await this.pool.query(
      'delete from transactions where user_id = $1 and id = $2',
      [userId, id],
    );
    return (r.rowCount ?? 0) > 0;
  }
  async listBudgets(userId: string) {
    const r = await this.pool.query<BudgetRow>(
      'select category, limit_cents from budgets where user_id = $1 order by category',
      [userId],
    );
    return r.rows.map(budgetFromRow);
  }
  async setBudget(userId: string, category: string, limitCents: number) {
    const r = await this.pool.query<BudgetRow>(
      'insert into budgets (user_id, category, limit_cents) values ($1, $2, $3) on conflict (user_id, category) do update set limit_cents = $3 returning category, limit_cents',
      [userId, category, limitCents],
    );
    return budgetFromRow(r.rows[0]!);
  }
  async removeBudget(userId: string, category: string) {
    const r = await this.pool.query(
      'delete from budgets where user_id = $1 and category = $2',
      [userId, category],
    );
    return (r.rowCount ?? 0) > 0;
  }
}
