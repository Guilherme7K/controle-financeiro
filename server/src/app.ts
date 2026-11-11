import express from 'express';
import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import type { ApiError } from '../../shared/types';
import type { Storage } from './storage/types';
import { getJwtSecret, requireAuth } from './auth';
import { authRoutes } from './routes/auth';
import { budgetRoutes } from './routes/budgets';
import { transactionRoutes } from './routes/transactions';

export function createApp(storage: Storage) {
  const secret = getJwtSecret();
  const app = express();
  app.use(express.json());
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });
  app.use('/api/auth', authRoutes(storage, secret));
  app.use('/api/budgets', requireAuth(secret), budgetRoutes(storage));
  app.use('/api', requireAuth(secret), transactionRoutes(storage));
  app.use((_req, res) => {
    res.status(404).json({ error: 'Rota não encontrada' } satisfies ApiError);
  });
  const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    if (err instanceof ZodError) {
      res
        .status(400)
        .json({
          error: 'Dados inválidos',
          issues: err.issues.map((issue) => ({
            path: issue.path.join('.'),
            message: issue.message,
          })),
        } satisfies ApiError);
      return;
    }
    if (err instanceof SyntaxError) {
      res.status(400).json({ error: 'JSON inválido' } satisfies ApiError);
      return;
    }
    console.error('Erro interno do servidor');
    res.status(500).json({ error: 'Erro interno do servidor' } satisfies ApiError);
  };
  app.use(errorHandler);
  return app;
}
