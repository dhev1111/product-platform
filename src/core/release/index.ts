import type { Product, ProductId } from '../product.js';

export interface ReleaseRequest {
  readonly product: Product;
  /** Defaults to the product's manifest version. */
  readonly version?: string;
  readonly notes?: string;
}

export interface Release {
  readonly id: string;
  readonly productId: ProductId;
  readonly version: string;
  readonly notes?: string;
  /** ISO 8601 UTC timestamp. */
  readonly createdAt: string;
}

/**
 * Port for the RELEASE lifecycle stage (versioning, changelog, artifacts).
 * No implementation exists in Phase 1; concrete managers plug in behind
 * this interface.
 */
export interface ReleaseManager {
  createRelease(request: ReleaseRequest): Promise<Release>;
  listReleases(productId: ProductId): Promise<Release[]>;
}
