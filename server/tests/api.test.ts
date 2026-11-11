import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import type { NewTransaction } from '../../shared/types';
import { createApp } from '../src/app';
import { MemoryStorage } from '../src/storage/memory';

const valid: NewTransaction = {
  description: 'Supermercado',
  amountCents: 15990,
  type: 'expense',
  category: 'Alimentação',
  date: '2026-11-10',
};
describe('API autenticada', () => {
  let app: ReturnType<typeof createApp>;
  beforeEach(() => {
    app = createApp(new MemoryStorage());
  });
  async function register(email = 'a@exemplo.com') {
    return request(app)
      .post('/api/auth/register')
      .send({ name: 'Pessoa', email, password: 'senha123' });
  }
  it('cadastra, normaliza e-mail, não expõe hash e rejeita duplicado', async () => {
    const response = await register(' A@Exemplo.com ');
    expect(response.status).toBe(201);
    expect(response.body.user).toMatchObject({ name: 'Pessoa', email: 'a@exemplo.com' });
    expect(response.body.token).toBeTypeOf('string');
    expect(JSON.stringify(response.body)).not.toContain('password');
    expect((await register()).status).toBe(409);
    const me = await request(app)
      .get('/api/auth/me')
      .auth(response.body.token, { type: 'bearer' });
    expect(me.body).toEqual(response.body.user);
  });
  it('faz login e usa a mesma resposta para senha errada ou e-mail desconhecido', async () => {
    await register();
    expect(
      (
        await request(app)
          .post('/api/auth/login')
          .send({ email: 'a@exemplo.com', password: 'senha123' })
      ).status,
    ).toBe(200);
    for (const email of ['a@exemplo.com', 'outro@exemplo.com']) {
      const r = await request(app)
        .post('/api/auth/login')
        .send({ email, password: 'errada' });
      expect(r.status).toBe(401);
      expect(r.body.error).toBe('E-mail ou senha incorretos');
    }
  });
  it('protege os dados e mantém health público', async () => {
    expect((await request(app).get('/api/health')).status).toBe(200);
    for (const path of [
      '/api/transactions',
      '/api/summary',
      '/api/budgets',
      '/api/auth/me',
    ]) {
      expect((await request(app).get(path)).status).toBe(401);
      expect((await request(app).get(path).auth('lixo', { type: 'bearer' })).status).toBe(
        401,
      );
    }
  });
  it('isola lançamentos, permite editar e valida entradas', async () => {
    const a = (await register()).body.token;
    const b = (await register('b@exemplo.com')).body.token;
    const created = await request(app)
      .post('/api/transactions')
      .auth(b, { type: 'bearer' })
      .send(valid);
    expect(created.status).toBe(201);
    expect(
      (await request(app).get('/api/transactions').auth(a, { type: 'bearer' })).body,
    ).toEqual([]);
    expect(
      (
        await request(app)
          .put(`/api/transactions/${created.body.id}`)
          .auth(a, { type: 'bearer' })
          .send(valid)
      ).status,
    ).toBe(404);
    expect(
      (
        await request(app)
          .delete(`/api/transactions/${created.body.id}`)
          .auth(a, { type: 'bearer' })
      ).status,
    ).toBe(404);
    const updated = await request(app)
      .put(`/api/transactions/${created.body.id}`)
      .auth(b, { type: 'bearer' })
      .send({ ...valid, description: 'Feira' });
    expect(updated.status).toBe(200);
    expect(updated.body.description).toBe('Feira');
    expect(updated.body.createdAt).toBe(created.body.createdAt);
    expect(
      (
        await request(app)
          .post('/api/transactions')
          .auth(b, { type: 'bearer' })
          .send({ ...valid, amountCents: -5, date: '2026-02-31' })
      ).status,
    ).toBe(400);
    expect(
      (
        await request(app)
          .delete(`/api/transactions/${created.body.id}`)
          .auth(b, { type: 'bearer' })
      ).status,
    ).toBe(204);
  });
  it('filtra por mês e calcula resumo', async () => {
    const token = (await register()).body.token;
    for (const data of [
      valid,
      {
        ...valid,
        type: 'income',
        amountCents: 500000,
        category: 'Salário',
        date: '2026-11-20',
      },
      { ...valid, date: '2026-10-01' },
    ])
      await request(app)
        .post('/api/transactions')
        .auth(token, { type: 'bearer' })
        .send(data);
    const list = await request(app)
      .get('/api/transactions?month=2026-11')
      .auth(token, { type: 'bearer' });
    expect(list.body.map((t: NewTransaction) => t.date)).toEqual([
      '2026-11-20',
      '2026-11-10',
    ]);
    const summary = await request(app)
      .get('/api/summary?month=2026-11')
      .auth(token, { type: 'bearer' });
    expect(summary.body).toEqual({
      month: '2026-11',
      incomeCents: 500000,
      expenseCents: 15990,
      balanceCents: 484010,
      expensesByCategory: [{ category: 'Alimentação', totalCents: 15990 }],
    });
    expect(
      (
        await request(app)
          .get('/api/summary?month=11-2026')
          .auth(token, { type: 'bearer' })
      ).status,
    ).toBe(400);
  });
  it('define, atualiza, lista e remove orçamentos isolados', async () => {
    const a = (await register()).body.token;
    const b = (await register('b@exemplo.com')).body.token;
    const path = '/api/budgets/' + encodeURIComponent(' Alimentação ');
    expect(
      (
        await request(app)
          .put(path)
          .auth(a, { type: 'bearer' })
          .send({ limitCents: 80000 })
      ).body,
    ).toEqual({ category: 'Alimentação', limitCents: 80000 });
    expect(
      (
        await request(app)
          .put(path)
          .auth(a, { type: 'bearer' })
          .send({ limitCents: 90000 })
      ).status,
    ).toBe(200);
    expect(
      (await request(app).get('/api/budgets').auth(a, { type: 'bearer' })).body,
    ).toEqual([{ category: 'Alimentação', limitCents: 90000 }]);
    expect(
      (await request(app).get('/api/budgets').auth(b, { type: 'bearer' })).body,
    ).toEqual([]);
    expect((await request(app).delete(path).auth(b, { type: 'bearer' })).status).toBe(
      404,
    );
    expect((await request(app).delete(path).auth(a, { type: 'bearer' })).status).toBe(
      204,
    );
    expect((await request(app).delete(path).auth(a, { type: 'bearer' })).status).toBe(
      404,
    );
  });
  it('abre a conta de demonstração com lançamentos e orçamentos', async () => {
    expect((await register('demo@exemplo.com')).status).toBe(409);
    const demo = await request(app).post('/api/auth/demo');
    expect(demo.status).toBe(200);
    expect(demo.body.user.email).toBe('demo@exemplo.com');
    expect(
      (
        await request(app)
          .get('/api/transactions')
          .auth(demo.body.token, { type: 'bearer' })
      ).body,
    ).toHaveLength(7);
    expect(
      (await request(app).get('/api/budgets').auth(demo.body.token, { type: 'bearer' }))
        .body,
    ).toHaveLength(3);
    expect((await request(app).post('/api/auth/demo')).body.user.id).toBe(
      demo.body.user.id,
    );
  });
});
