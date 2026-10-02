import type { LifecycleStage, LifecycleStatus } from './lifecycle.js';
import type { ProductId } from './product.js';

/**
 * Shared shape of every lifecycle stage result. Concrete engines
 * (BuildEngine, TestEngine, ...) extend this with stage-specific fields and
 * narrow `stage` to their own lifecycle stage.
 */
export interface StageResult {
  readonly productId: ProductId;
  readonly stage: LifecycleStage;
  readonly status: LifecycleStatus;
  /** ISO 8601 UTC timestamp. */
  readonly startedAt: string;
  /** ISO 8601 UTC timestamp; absent while a stage is still running. */
  readonly finishedAt?: string;
  /** Populated when `status` is `failed`. */
  readonly error?: string;
}
