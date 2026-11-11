// Ponto de entrada da API na Vercel. É o mesmo app do desenvolvimento local;
// a diferença é que aqui não chamamos listen(): a Vercel recebe o app exportado
// e transforma em uma função serverless.
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import express from 'express';
import { createApp } from './app';
import { createStorage } from './storage';

// Conectar ao banco é assíncrono, então o app real fica numa promessa criada uma
// única vez por instância e reaproveitada pelas próximas requisições.
// Sem DATABASE_URL, cai no arquivo JSON na pasta temporária (único local gravável).
const appPromise = createStorage(join(tmpdir(), 'finance.json')).then(createApp);

const app = express();
app.use((req, res, next) => {
  appPromise.then((realApp) => realApp(req, res, next)).catch(next);
});

export default app;
