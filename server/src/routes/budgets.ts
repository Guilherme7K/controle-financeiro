import { Router } from 'express';
import { z } from 'zod';
import type { Storage } from '../storage/types';
const categorySchema = z.string().trim().min(1, 'Informe uma categoria').max(40);
const budgetSchema = z.object({
  limitCents: z
    .number()
    .int()
    .positive('O limite deve ser maior que zero')
    .max(2147483647, 'Limite acima do permitido'),
});
export function budgetRoutes(storage: Storage) {
  const router = Router();
  router.get('/', async (_req, res) => {
    res.json(await storage.listBudgets(res.locals.userId as string));
  });
  router.put('/:category', async (req, res) => {
    const category = categorySchema.parse(req.params.category);
    const { limitCents } = budgetSchema.parse(req.body);
    res.json(await storage.setBudget(res.locals.userId as string, category, limitCents));
  });
  router.delete('/:category', async (req, res) => {
    const category = categorySchema.parse(req.params.category);
    if (!(await storage.removeBudget(res.locals.userId as string, category))) {
      res.status(404).json({ error: 'Orçamento não encontrado' });
      return;
    }
    res.status(204).end();
  });
  return router;
}
