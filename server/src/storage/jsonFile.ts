import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import type { NewTransaction } from '../../../shared/types';
import { MemoryStorage } from './memory';
import type { MemoryData } from './memory';
import type { UserInput } from './types';

export class JsonFileStorage extends MemoryStorage {
  constructor(private readonly filePath: string) {
    super(
      existsSync(filePath)
        ? (JSON.parse(readFileSync(filePath, 'utf8')) as MemoryData)
        : undefined,
    );
  }
  private persist() {
    mkdirSync(dirname(this.filePath), { recursive: true });
    writeFileSync(this.filePath, JSON.stringify(this.data, null, 2));
  }
  override async createUser(data: UserInput) {
    const result = await super.createUser(data);
    this.persist();
    return result;
  }
  override async createTransaction(userId: string, data: NewTransaction) {
    const result = await super.createTransaction(userId, data);
    this.persist();
    return result;
  }
  override async updateTransaction(userId: string, id: string, data: NewTransaction) {
    const result = await super.updateTransaction(userId, id, data);
    if (result) this.persist();
    return result;
  }
  override async removeTransaction(userId: string, id: string) {
    const result = await super.removeTransaction(userId, id);
    if (result) this.persist();
    return result;
  }
  override async setBudget(userId: string, category: string, limitCents: number) {
    const result = await super.setBudget(userId, category, limitCents);
    this.persist();
    return result;
  }
  override async removeBudget(userId: string, category: string) {
    const result = await super.removeBudget(userId, category);
    if (result) this.persist();
    return result;
  }
}
