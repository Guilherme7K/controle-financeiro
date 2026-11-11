import jwt from 'jsonwebtoken';
import type { RequestHandler } from 'express';

let warned = false;
export function getJwtSecret(): string {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  if (process.env.VERCEL || process.env.NODE_ENV === 'production')
    throw new Error('JWT_SECRET é obrigatório em produção');
  if (!warned) {
    console.warn('JWT_SECRET não definido; usando segredo de desenvolvimento.');
    warned = true;
  }
  return 'segredo-fixo-apenas-para-desenvolvimento';
}
export function signToken(userId: string, secret: string): string {
  return jwt.sign({ sub: userId }, secret, { expiresIn: '7d' });
}
export function requireAuth(secret: string): RequestHandler {
  return (req, res, next) => {
    const header = req.get('Authorization');
    try {
      if (!header?.startsWith('Bearer ')) throw new Error('Token ausente');
      const payload = jwt.verify(header.slice(7), secret);
      if (
        typeof payload === 'string' ||
        typeof payload.sub !== 'string' ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          payload.sub,
        )
      )
        throw new Error('Token inválido');
      res.locals.userId = payload.sub;
      next();
    } catch {
      res.status(401).json({ error: 'Não autenticado' });
    }
  };
}
