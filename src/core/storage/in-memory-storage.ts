import type { Storage } from './storage.js';

/** Ephemeral {@link Storage} backed by a plain `Map`. Default for Phase 1. */
export class InMemoryStorage implements Storage {
  private readonly entries = new Map<string, unknown>();

  async get<T>(key: string): Promise<T | undefined> {
    return this.entries.get(key) as T | undefined;
  }

  async set<T>(key: string, value: T): Promise<void> {
    this.entries.set(key, value);
  }

  async delete(key: string): Promise<boolean> {
    return this.entries.delete(key);
  }

  async keys(prefix?: string): Promise<string[]> {
    const all = [...this.entries.keys()];
    if (prefix === undefined) {
      return all;
    }
    return all.filter((key) => key.startsWith(prefix));
  }
}
