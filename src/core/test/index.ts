import type { Product } from '../product.js';
import type { StageResult } from '../stage.js';

export interface TestRequest {
  readonly product: Product;
  /** Optional scope hint (suite, path or ref). Reserved for later phases. */
  readonly scope?: string;
}

export interface TestSummary {
  readonly total: number;
  readonly passed: number;
  readonly failed: number;
  readonly skipped: number;
}

export interface TestResult extends StageResult {
  readonly stage: 'test';
  readonly summary?: TestSummary;
}

/**
 * Port for the TEST lifecycle stage. No implementation exists in Phase 1;
 * concrete engines plug in behind this interface.
 */
export interface TestEngine {
  test(request: TestRequest): Promise<TestResult>;
}
