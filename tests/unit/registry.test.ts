import { describe, expect, it, vi } from 'vitest';

import { ManifestValidationError } from '../../src/core/manifest/index.js';
import {
  DuplicateProductError,
  InMemoryProductRegistry,
} from '../../src/core/registry/index.js';
import { InMemoryStorage } from '../../src/core/storage/index.js';

const manifest = { name: 'my-product', version: '1.0.0' };
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

describe('InMemoryProductRegistry', () => {
  it('registers a valid product with registry-assigned metadata', async () => {
    const registry = new InMemoryProductRegistry();

    const product = await registry.register(manifest);

    expect(product.id).toMatch(UUID_PATTERN);
    expect(product.manifest).toEqual(manifest);
    expect(product.stage).toBe('register');
    expect(product.createdAt).toBe(product.updatedAt);
    expect(Number.isNaN(Date.parse(product.createdAt))).toBe(false);
  });

  it('rejects invalid manifests and stores nothing', async () => {
    const registry = new InMemoryProductRegistry();

    await expect(
      registry.register({ name: 'Bad Name', version: '1.0.0' }),
    ).rejects.toBeInstanceOf(ManifestValidationError);
    await expect(registry.list()).resolves.toHaveLength(0);
  });

  it('enforces unique product names', async () => {
    const registry = new InMemoryProductRegistry();
    await registry.register(manifest);

    await expect(registry.register({ ...manifest, version: '2.0.0' })).rejects.toBeInstanceOf(
      DuplicateProductError,
    );
  });

  it('looks products up by id and by name', async () => {
    const registry = new InMemoryProductRegistry();
    const product = await registry.register(manifest);

    await expect(registry.get(product.id)).resolves.toEqual(product);
    await expect(registry.get('missing-id')).resolves.toBeUndefined();
    await expect(registry.findByName('my-product')).resolves.toEqual(product);
    await expect(registry.findByName('missing-name')).resolves.toBeUndefined();
  });

  it('lists products oldest first', async () => {
    const registry = new InMemoryProductRegistry();

    // Control the clock so the two products get distinct createdAt values;
    // otherwise same-millisecond registrations fall back to arbitrary id order.
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
      const first = await registry.register({ name: 'first', version: '0.1.0' });
      vi.setSystemTime(new Date('2026-01-01T00:00:00.100Z'));
      const second = await registry.register({ name: 'second', version: '0.2.0' });

      const listed = await registry.list();
      expect(listed.map((product) => product.id)).toEqual([first.id, second.id]);
    } finally {
      vi.useRealTimers();
    }
  });

  it('removes products', async () => {
    const registry = new InMemoryProductRegistry();
    const product = await registry.register(manifest);

    await expect(registry.remove(product.id)).resolves.toBe(true);
    await expect(registry.get(product.id)).resolves.toBeUndefined();
    await expect(registry.findByName('my-product')).resolves.toBeUndefined();
    await expect(registry.remove(product.id)).resolves.toBe(false);
  });

  it('shares state through an injected storage', async () => {
    const shared = new InMemoryStorage();
    const registryA = new InMemoryProductRegistry(shared);
    const registryB = new InMemoryProductRegistry(shared);

    const product = await registryA.register(manifest);

    await expect(registryB.findByName('my-product')).resolves.toEqual(product);
    await expect(registryB.list()).resolves.toHaveLength(1);
  });

  it('keeps separate registries isolated by default', async () => {
    const registryA = new InMemoryProductRegistry();
    const registryB = new InMemoryProductRegistry();

    await registryA.register(manifest);
    await registryB.register({ name: 'other-product', version: '1.0.0' });

    await expect(registryA.findByName('other-product')).resolves.toBeUndefined();
    await expect(registryB.findByName('my-product')).resolves.toBeUndefined();
    await expect(registryA.list()).resolves.toHaveLength(1);
    await expect(registryB.list()).resolves.toHaveLength(1);
  });
});
