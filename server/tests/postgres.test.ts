import { newDb } from 'pg-mem';
import type { Pool } from 'pg';
import { describe, expect, it } from 'vitest';
import { PostgresStorage } from '../src/storage/postgres';

describe('PostgresStorage', () => {
  it('persiste usuários, lançamentos e orçamentos com isolamento', async () => {
    const pg = newDb().adapters.createPg();
    const pool = new pg.Pool() as unknown as Pool;
    const storage = new PostgresStorage(pool);
    await storage.init();
    const a = await storage.createUser({
      name: 'A',
      email: ' A@Exemplo.com ',
      passwordHash: 'hash',
    });
    const b = await storage.createUser({
      name: 'B',
      email: 'b@exemplo.com',
      passwordHash: 'hash2',
    });
    expect((await storage.findUserByEmail('A@EXEMPLO.COM'))?.id).toBe(a.id);
    expect((await storage.findUserById(b.id))?.name).toBe('B');
    expect(await storage.findUserByEmail('none@exemplo.com')).toBeNull();
    const data = {
      description: 'Teste',
      amountCents: 100,
      type: 'expense' as const,
      category: 'Lazer',
      date: '2026-11-10',
    };
    const item = await storage.createTransaction(a.id, data);
    await storage.createTransaction(a.id, { ...data, date: '2026-10-10' });
    expect(item.createdAt).toMatch(/^\d{4}-/);
    expect(await storage.listTransactions(b.id)).toEqual([]);
    expect(await storage.listTransactions(a.id, { month: '2026-11' })).toHaveLength(1);
    expect(await storage.updateTransaction(b.id, item.id, data)).toBeNull();
    expect(await storage.removeTransaction(b.id, item.id)).toBe(false);
    expect(
      (
        await storage.updateTransaction(a.id, item.id, {
          ...data,
          description: 'Alterado',
        })
      )?.description,
    ).toBe('Alterado');
    await storage.setBudget(a.id, 'Lazer', 1000);
    await storage.setBudget(a.id, 'Lazer', 2000);
    await storage.setBudget(b.id, 'Lazer', 3000);
    expect(await storage.listBudgets(a.id)).toEqual([
      { category: 'Lazer', limitCents: 2000 },
    ]);
    expect(await storage.listBudgets(b.id)).toEqual([
      { category: 'Lazer', limitCents: 3000 },
    ]);
    expect(await storage.removeBudget(a.id, 'Lazer')).toBe(true);
    expect(await storage.removeBudget(a.id, 'Lazer')).toBe(false);
    expect(await storage.removeTransaction(a.id, item.id)).toBe(true);
    expect(await storage.removeTransaction(a.id, item.id)).toBe(false);
    await pool.end();
  });
});
