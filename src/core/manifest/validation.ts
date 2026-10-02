import type { ProductManifest } from './product-manifest.js';

/** A single manifest validation failure. */
export interface ManifestError {
  /** Field the error refers to; empty string for root-level errors. */
  readonly field: string;
  readonly message: string;
}

export type ManifestValidationResult =
  | { readonly ok: true; readonly manifest: ProductManifest }
  | { readonly ok: false; readonly errors: readonly ManifestError[] };

/** Thrown by {@link parseManifest} when a manifest fails validation. */
export class ManifestValidationError extends Error {
  readonly errors: readonly ManifestError[];

  constructor(errors: readonly ManifestError[]) {
    super(
      `Invalid product manifest: ${errors
        .map((error) => `${error.field || '(root)'}: ${error.message}`)
        .join('; ')}`,
    );
    this.name = 'ManifestValidationError';
    this.errors = errors;
  }
}

const NAME_PATTERN = /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/;
const VERSION_PATTERN =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
const MAX_NAME_LENGTH = 64;
const MAX_TAGS = 20;

const OPTIONAL_STRING_FIELDS = ['description', 'owner', 'repository'] as const;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Validate an unknown input against the product contract. Returns a
 * discriminated result instead of throwing so callers (registry, CLI, and
 * later HTTP handlers) can report every error at once. Input values are
 * trimmed and unknown fields are rejected, so typos never silently
 * disappear.
 */
export function validateManifest(input: unknown): ManifestValidationResult {
  if (!isPlainObject(input)) {
    return { ok: false, errors: [{ field: '', message: 'Manifest must be a JSON object.' }] };
  }

  const errors: ManifestError[] = [];

  // name (required)
  const rawName = input['name'];
  if (typeof rawName !== 'string' || rawName.trim().length === 0) {
    errors.push({ field: 'name', message: 'name is required and must be a non-empty string.' });
  } else {
    const name = rawName.trim();
    if (name.length > MAX_NAME_LENGTH) {
      errors.push({ field: 'name', message: `name must be at most ${MAX_NAME_LENGTH} characters.` });
    } else if (!NAME_PATTERN.test(name)) {
      errors.push({
        field: 'name',
        message:
          'name must be lowercase letters and digits separated by ".", "_" or "-" (e.g. "my-product").',
      });
    }
  }

  // version (required)
  const rawVersion = input['version'];
  if (typeof rawVersion !== 'string' || rawVersion.trim().length === 0) {
    errors.push({
      field: 'version',
      message: 'version is required and must be a non-empty string.',
    });
  } else if (!VERSION_PATTERN.test(rawVersion.trim())) {
    errors.push({
      field: 'version',
      message:
        'version must be semantic (MAJOR.MINOR.PATCH), optionally with a pre-release or build suffix (e.g. "1.4.2" or "2.0.0-rc.1").',
    });
  }

  // optional string fields
  for (const field of OPTIONAL_STRING_FIELDS) {
    const value = input[field];
    if (value === undefined) continue;
    if (typeof value !== 'string' || value.trim().length === 0) {
      errors.push({ field, message: `${field} must be a non-empty string when provided.` });
    }
  }

  // tags (optional array of non-empty strings)
  const tags = input['tags'];
  if (tags !== undefined) {
    if (
      !Array.isArray(tags) ||
      tags.some((tag) => typeof tag !== 'string' || tag.trim().length === 0)
    ) {
      errors.push({
        field: 'tags',
        message: 'tags must be an array of non-empty strings when provided.',
      });
    } else if (tags.length > MAX_TAGS) {
      errors.push({ field: 'tags', message: `tags must contain at most ${MAX_TAGS} entries.` });
    }
  }

  // unknown fields are rejected so typos never silently disappear
  const allowedFields = new Set<string>(['name', 'version', 'tags', ...OPTIONAL_STRING_FIELDS]);
  for (const field of Object.keys(input)) {
    if (!allowedFields.has(field)) {
      errors.push({ field, message: `Unknown manifest field "${field}".` });
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const description = input['description'];
  const owner = input['owner'];
  const repository = input['repository'];
  const tagList = input['tags'];

  // The input has been fully validated above.
  const manifest: ProductManifest = {
    name: (rawName as string).trim(),
    version: (rawVersion as string).trim(),
    ...(typeof description === 'string' ? { description: description.trim() } : {}),
    ...(typeof owner === 'string' ? { owner: owner.trim() } : {}),
    ...(typeof repository === 'string' ? { repository: repository.trim() } : {}),
    ...(Array.isArray(tagList) && tagList.length > 0
      ? { tags: tagList.map((tag) => (tag as string).trim()) }
      : {}),
  };

  return { ok: true, manifest };
}

/** Validate an unknown input, throwing {@link ManifestValidationError} on failure. */
export function parseManifest(input: unknown): ProductManifest {
  const result = validateManifest(input);
  if (!result.ok) {
    throw new ManifestValidationError(result.errors);
  }
  return result.manifest;
}
