import { Router } from 'express';
import type { Storage } from '../storage/types';
import { monthQuerySchema, newTransactionSchema } from '../schemas';
import { summarize } from '../summary';
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function transactionRoutes(storage: Storage) {
  const router = Router();
  router.get('/transactions', async (req, res) => {
    const { month } = monthQuerySchema.parse(req.query);
    res.json(await storage.listTransactions(res.locals.userId as string, { month }));
  });
  router.post('/transactions', async (req, res) => {
    res
      .status(201)
      .json(
        await storage.createTransaction(
          res.locals.userId as string,
          newTransactionSchema.parse(req.body),
        ),
      );
  });
  router.put('/transactions/:id', async (req, res) => {
    const data = newTransactionSchema.parse(req.body);
    const result = uuid.test(req.params.id)
      ? await storage.updateTransaction(res.locals.userId as string, req.params.id, data)
      : null;
    if (!result) {
      res.status(404).json({ error: 'Lançamento não encontrado' });
      return;
    }
    res.json(result);
  });
  router.delete('/transactions/:id', async (req, res) => {
    const removed =
      uuid.test(req.params.id) &&
      (await storage.removeTransaction(res.locals.userId as string, req.params.id));
    if (!removed) {
      res.status(404).json({ error: 'Lançamento não encontrado' });
      return;
    }
    res.status(204).end();
  });
  router.get('/summary', async (req, res) => {
    const { month } = monthQuerySchema.parse(req.query);
    res.json(
      summarize(
        await storage.listTransactions(res.locals.userId as string, { month }),
        month ?? null,
      ),
    );
  });
  return router;
}
