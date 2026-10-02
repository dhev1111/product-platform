/**
 * Canonical product lifecycle stages, in execution order:
 *
 *   REGISTER → BUILD → TEST → RELEASE → DEPLOY → HEALTH_CHECK → MONITOR → ROLLBACK
 *
 * Phase 1 only exercises `register`; the remaining stages are contracts that
 * later phases implement.
 */
export const LIFECYCLE_STAGES = [
  'register',
  'build',
  'test',
  'release',
  'deploy',
  'health_check',
  'monitor',
  'rollback',
] as const;

export type LifecycleStage = (typeof LIFECYCLE_STAGES)[number];

/**
 * Coarse-grained status shared by every lifecycle stage, so stage results
 * stay comparable and serializable across the platform.
 */
export type LifecycleStatus =
  | 'pending'
  | 'in_progress'
  | 'succeeded'
  | 'failed'
  | 'skipped'
  | 'cancelled';

/** Narrow an unknown value to a {@link LifecycleStage}. */
export function isLifecycleStage(value: unknown): value is LifecycleStage {
  return typeof value === 'string' && (LIFECYCLE_STAGES as readonly string[]).includes(value);
}
