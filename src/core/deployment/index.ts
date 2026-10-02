import type { Product } from '../product.js';
import type { StageResult } from '../stage.js';

export interface DeployRequest {
  readonly product: Product;
  /** Release to deploy; defaults to the product's latest release. */
  readonly releaseId?: string;
  /** Environment or platform target (e.g. "production"). */
  readonly target?: string;
}

export interface DeploymentResult extends StageResult {
  readonly stage: 'deploy';
  readonly deploymentId?: string;
  /** Public URL of the deployment, when applicable. */
  readonly url?: string;
}

/**
 * Port for the DEPLOY lifecycle stage. Providers (cloud, Vercel, ...)
 * plug in behind this interface in later phases — none exists in Phase 1.
 */
export interface DeploymentProvider {
  /** Stable provider identifier (e.g. "vercel"). */
  readonly name: string;
  deploy(request: DeployRequest): Promise<DeploymentResult>;
}
