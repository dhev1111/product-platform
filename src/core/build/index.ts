import type { Product } from '../product.js';
import type { StageResult } from '../stage.js';

export interface BuildRequest {
  readonly product: Product;
  /** Optional source hint (ref, path or URL). Reserved for later phases. */
  readonly source?: string;
}

export interface BuildResult extends StageResult {
  readonly stage: 'build';
  /** Human-readable build output, when available. */
  readonly buildLog?: string;
  /** Identifiers or paths of produced artifacts. */
  readonly artifacts?: string[];
}

/**
 * Port for the BUILD lifecycle stage. No implementation exists in Phase 1;
 * concrete engines plug in behind this interface.
 */
export interface BuildEngine {
  build(request: BuildRequest): Promise<BuildResult>;
}
