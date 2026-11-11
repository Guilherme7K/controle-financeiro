import { resolve } from 'node:path';
import { createApp } from './app';
import { createStorage } from './storage';

// O comando do workspace executa o servidor a partir da pasta server.
async function start() {
  const app = createApp(await createStorage(resolve('data', 'finance.json')));
  const port = Number(process.env.API_PORT ?? 3333);
  app.listen(port, () => {
    console.log(`API rodando em http://localhost:${port}`);
  });
}
void start().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
