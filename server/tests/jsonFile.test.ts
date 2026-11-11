import { mkdtempSync, readFileSync, rmdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { JsonFileStorage } from '../src/storage/jsonFile';

describe('JsonFileStorage', () => {
  it('reabre usuários, lançamentos e orçamentos após as alterações', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'finance-test-'));
    const file = join(directory, 'dados.json');
    try {
      const storage = new JsonFileStorage(file);
      const user = await storage.createUser({
        name: 'Pessoa',
        email: ' Pessoa@Exemplo.com ',
        passwordHash: 'hash',
      });
      const data = {
        description: 'Conta',
        amountCents: 100,
        type: 'expense' as const,
        category: 'Lazer',
        date: '2026-11-10',
      };
      const item = await storage.createTransaction(user.id, data);
      await storage.updateTransaction(user.id, item.id, { ...data, amountCents: 200 });
      await storage.setBudget(user.id, 'Lazer', 500);
      const restored = new JsonFileStorage(file);
      expect((await restored.findUserByEmail('pessoa@exemplo.com'))?.id).toBe(user.id);
      expect((await restored.listTransactions(user.id))[0]?.amountCents).toBe(200);
      expect(await restored.listBudgets(user.id)).toEqual([
        { category: 'Lazer', limitCents: 500 },
      ]);
      await restored.removeTransaction(user.id, item.id);
      await restored.removeBudget(user.id, 'Lazer');
      const saved = JSON.parse(readFileSync(file, 'utf8')) as {
        transactions: unknown[];
        budgets: unknown[];
      };
      expect(saved.transactions).toEqual([]);
      expect(saved.budgets).toEqual([]);
    } finally {
      rmSync(file, { force: true });
      rmdirSync(directory);
    }
  });
});
