import { randomBytes } from 'node:crypto';
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import type { User } from '../../../shared/types';
import type { Storage, StoredUser } from '../storage/types';
import { requireAuth, signToken } from '../auth';
import { seedTransactions } from '../seed';

const emailSchema = z.string().trim().toLowerCase().email('Informe um e-mail válido');
const registerSchema = z.object({
  name: z.string().trim().min(1, 'Informe seu nome').max(80),
  email: emailSchema,
  password: z
    .string()
    .min(8, 'Use pelo menos 8 caracteres')
    .max(72)
    .refine((s) => Buffer.byteLength(s, 'utf8') <= 72, 'Use no máximo 72 bytes'),
});
const loginSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(1)
    .max(72)
    .refine((s) => Buffer.byteLength(s, 'utf8') <= 72, 'Use no máximo 72 bytes'),
});
function publicUser(user: StoredUser): User {
  return { id: user.id, name: user.name, email: user.email };
}
function isDuplicate(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.message === 'EMAIL_EXISTS' || ('code' in error && error.code === '23505'))
  );
}

export function authRoutes(storage: Storage, secret: string) {
  const router = Router();
  let demoPromise: Promise<StoredUser> | null = null;
  let demoReset: Promise<unknown> = Promise.resolve();

  // Apaga tudo da conta de demonstração e recria os exemplos no mês atual.
  // Assim quem entra sempre vê o painel preenchido, mesmo meses depois ou
  // se o visitante anterior apagou os lançamentos.
  async function resetDemoData(userId: string) {
    for (const t of await storage.listTransactions(userId))
      await storage.removeTransaction(userId, t.id);
    for (const b of await storage.listBudgets(userId))
      await storage.removeBudget(userId, b.category);
    for (const { id: _id, createdAt: _createdAt, ...data } of seedTransactions())
      await storage.createTransaction(userId, data);
    for (const [category, limit] of [
      ['Alimentação', 80000],
      ['Lazer', 20000],
      ['Moradia', 200000],
    ] as const)
      await storage.setBudget(userId, category, limit);
  }
  router.post('/register', async (req, res) => {
    const data = registerSchema.parse(req.body);
    if (
      data.email === 'demo@exemplo.com' ||
      (await storage.findUserByEmail(data.email))
    ) {
      res.status(409).json({ error: 'E-mail já cadastrado' });
      return;
    }
    try {
      const user = await storage.createUser({
        name: data.name,
        email: data.email,
        passwordHash: await bcrypt.hash(data.password, 10),
      });
      res.status(201).json({ token: signToken(user.id, secret), user: publicUser(user) });
    } catch (error) {
      if (isDuplicate(error)) {
        res.status(409).json({ error: 'E-mail já cadastrado' });
        return;
      }
      throw error;
    }
  });
  router.post('/login', async (req, res) => {
    const data = loginSchema.parse(req.body);
    const user = await storage.findUserByEmail(data.email);
    if (!user || !(await bcrypt.compare(data.password, user.passwordHash))) {
      res.status(401).json({ error: 'E-mail ou senha incorretos' });
      return;
    }
    res.json({ token: signToken(user.id, secret), user: publicUser(user) });
  });
  router.post('/demo', async (_req, res) => {
    // Uma promessa evita criar duas contas no mesmo processo em acessos simultâneos.
    demoPromise ??= (async () => {
      const existing = await storage.findUserByEmail('demo@exemplo.com');
      if (existing) return existing;
      try {
        return await storage.createUser({
          name: 'Visitante',
          email: 'demo@exemplo.com',
          passwordHash: await bcrypt.hash(randomBytes(32).toString('hex'), 10),
        });
      } catch (error) {
        if (isDuplicate(error)) {
          const found = await storage.findUserByEmail('demo@exemplo.com');
          if (found) return found;
        }
        throw error;
      }
    })().catch((error: unknown) => {
      demoPromise = null;
      throw error;
    });
    const user = await demoPromise;
    // As recriações entram em fila: dois acessos ao mesmo tempo não duplicam os dados.
    const reset = demoReset.then(() => resetDemoData(user.id));
    demoReset = reset.catch(() => undefined);
    await reset;
    res.json({ token: signToken(user.id, secret), user: publicUser(user) });
  });
  router.get('/me', requireAuth(secret), async (_req, res) => {
    const user = await storage.findUserById(res.locals.userId as string);
    if (!user) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }
    res.json(publicUser(user));
  });
  return router;
}
