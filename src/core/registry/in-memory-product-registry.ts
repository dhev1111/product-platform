import { randomUUID } from 'node:crypto';

import { parseManifest } from '../manifest/validation.js';
import type { Product } from '../product.js';
import { InMemoryStorage } from '../storage/in-memory-storage.js';
import type { Storage } from '../storage/storage.js';
import type { ProductRegistry } from './product-registry.js';

/** Thrown when registering a product whose name is already taken. */
export class DuplicateProductError extends Error {
  constructor(name: string) {
    super(`A product named "${name}" is already registered.`);
    this.name = 'DuplicateProductError';
  }
}

const PRODUCT_KEY_PREFIX = 'product:';
const NAME_INDEX_PREFIX = 'product-name:';

/**
 * Phase 1 {@link ProductRegistry} implementation backed by any
 * {@link Storage} (in-memory by default). Swapping in a persistent store
 * later requires no changes to this class or its callers.
 */
export class InMemoryProductRegistry implements ProductRegistry {
  private readonly storage: Storage;

  constructor(storage: Storage = new InMemoryStorage()) {
    this.storage = storage;
  }

  async register(input: unknown): Promise<Product> {
    const manifest = parseManifest(input);

    const existingId = await this.storage.get<string>(`${NAME_INDEX_PREFIX}${manifest.name}`);
    if (existingId !== undefined) {
      throw new DuplicateProductError(manifest.name);
    }

    const now = new Date().toISOString();
    const product: Product = {
      id: randomUUID(),
      manifest,
      stage: 'register',
      createdAt: now,
      updatedAt: now,
    };

    await this.storage.set(`${PRODUCT_KEY_PREFIX}${product.id}`, product);
    await this.storage.set(`${NAME_INDEX_PREFIX}${manifest.name}`, product.id);

    return product;
  }

  async get(id: string): Promise<Product | undefined> {
    return this.storage.get<Product>(`${PRODUCT_KEY_PREFIX}${id}`);
  }

  async findByName(name: string): Promise<Product | undefined> {
    const id = await this.storage.get<string>(`${NAME_INDEX_PREFIX}${name}`);
    if (id === undefined) {
      return undefined;
    }
    return this.get(id);
  }

  async list(): Promise<Product[]> {
    const keys = await this.storage.keys(PRODUCT_KEY_PREFIX);
    const products = await Promise.all(keys.map((key) => this.storage.get<Product>(key)));
    return products
      .filter((product): product is Product => product !== undefined)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
  }

  async remove(id: string): Promise<boolean> {
    const product = await this.get(id);
    if (product === undefined) {
      return false;
    }
    await this.storage.delete(`${NAME_INDEX_PREFIX}${product.manifest.name}`);
    await this.storage.delete(`${PRODUCT_KEY_PREFIX}${id}`);
    return true;
  }
}
