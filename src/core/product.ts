import type { LifecycleStage } from './lifecycle.js';
import type { ProductManifest } from './manifest/product-manifest.js';

/** Stable, unique identifier of a registered product. */
export type ProductId = string;

/**
 * A registered product: a validated manifest plus registry-assigned
 * metadata. `createdAt` / `updatedAt` are ISO 8601 UTC timestamps.
 */
export interface Product {
  readonly id: ProductId;
  readonly manifest: ProductManifest;
  /** Lifecycle stage the product currently sits in (starts at `register`). */
  readonly stage: LifecycleStage;
  readonly createdAt: string;
  readonly updatedAt: string;
}
