import type { ProductId } from '../product.js';

export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'unknown';

export interface HealthTarget {
  readonly productId?: ProductId;
  readonly url?: string;
}

export interface HealthReport {
  readonly productId?: ProductId;
  readonly status: HealthStatus;
  /** ISO 8601 UTC timestamp. */
  readonly checkedAt: string;
  readonly latencyMs?: number;
  readonly message?: string;
}

/**
 * Port for the HEALTH CHECK and MONITOR lifecycle stages. No
 * implementation exists in Phase 1; concrete checkers plug in behind this
 * interface.
 */
export interface HealthChecker {
  check(target: HealthTarget): Promise<HealthReport>;
}
