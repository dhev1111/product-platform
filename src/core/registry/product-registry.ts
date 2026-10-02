import type { Product } from '../product.js';

/**
 * Port for product registration and lookup. Registration always validates
 * the manifest against the product contract and enforces unique names, so
 * invalid products can never enter the platform.
 */
export interface ProductRegistry {
  /**
   * Validate `input` as a {@link ProductManifest} and register it as a new
   * product. Rejects with `ManifestValidationError` for an invalid manifest
   * and `DuplicateProductError` for an already-used product name.
   */
  register(input: unknown): Promise<Product>;

  /** Fetch a product by id; `undefined` when unknown. */
  get(id: string): Promise<Product | undefined>;

  /** Fetch a product by its unique manifest name; `undefined` when unknown. */
  findByName(name: string): Promise<Product | undefined>;

  /** All registered products, oldest first. */
  list(): Promise<Product[]>;

  /** Remove a product by id. Resolves `true` when the product existed. */
  remove(id: string): Promise<boolean>;
}
