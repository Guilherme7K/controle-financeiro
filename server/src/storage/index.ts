import { Pool } from 'pg';
import { JsonFileStorage } from './jsonFile';
import { PostgresStorage } from './postgres';
import type { Storage } from './types';

export async function createStorage(dataFilePath: string): Promise<Storage> {
  if (!process.env.DATABASE_URL) return new JsonFileStorage(dataFilePath);
  const storage = new PostgresStorage(
    new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 3,
    }),
  );
  await storage.init();
  return storage;
}
