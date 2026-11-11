import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Request, Response } from 'express';
import { createApp } from '../server/src/app';
import { createStorage } from '../server/src/storage';

// A promessa é compartilhada entre chamadas da mesma instância serverless.
const appPromise = createStorage(join(tmpdir(), 'finance.json')).then(createApp);
export default function handler(req: Request, res: Response) {
  return appPromise.then((app) => app(req, res));
}
