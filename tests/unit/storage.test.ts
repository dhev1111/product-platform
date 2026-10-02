import { describe, expect, it } from 'vitest';

import { InMemoryStorage } from '../../src/core/storage/index.js';

describe('InMemoryStorage', () => {
  it('stores and reads values', async () => {
    const storage = new InMemoryStorage();

    await expect(storage.get('missing')).resolves.toBeUndefined();

    await storage.set('key', { value: 42 });
    await expect(storage.get<{ value: number }>('key')).resolves.toEqual({ value: 42 });
  });

  it('deletes keys and reports existence', async () => {
    const storage = new InMemoryStorage();

    await storage.set('key', 'value');
    await expect(storage.delete('key')).resolves.toBe(true);
    await expect(storage.delete('key')).resolves.toBe(false);
    await expect(storage.get('key')).resolves.toBeUndefined();
  });

  it('lists keys with an optional prefix', async () => {
    const storage = new InMemoryStorage();

    await storage.set('product:1', 'a');
    await storage.set('product:2', 'b');
    await storage.set('other:1', 'c');

    await expect(storage.keys()).resolves.toHaveLength(3);
    await expect(storage.keys('product:')).resolves.toEqual(['product:1', 'product:2']);
    await expect(storage.keys('nope:')).resolves.toEqual([]);
  });
});
