import { describe, expect, it } from 'vitest';

import type { ProductManifest } from '../../src/core/manifest/index.js';
import {
  ManifestValidationError,
  parseManifest,
  validateManifest,
  type ManifestValidationResult,
} from '../../src/core/manifest/index.js';

const validManifest = {
  name: 'my-product',
  version: '1.0.0',
};

function expectOk(result: ManifestValidationResult): asserts result is {
  ok: true;
  manifest: ProductManifest;
} {
  if (!result.ok) {
    throw new Error(`expected a valid manifest, got: ${JSON.stringify(result.errors)}`);
  }
}

function fieldOf(result: ManifestValidationResult, index: number): string {
  if (result.ok) throw new Error('expected validation errors');
  const error = result.errors[index];
  if (error === undefined) throw new Error(`expected an error at index ${index}`);
  return error.field;
}

describe('validateManifest', () => {
  it('accepts a manifest with only the required fields', () => {
    const result = validateManifest(validManifest);
    expectOk(result);
    expect(result.manifest).toEqual({ name: 'my-product', version: '1.0.0' });
  });

  it('accepts every optional field and trims values', () => {
    const result = validateManifest({
      name: ' my-product ',
      version: ' 2.0.0-rc.1+build.5 ',
      description: '  Demo product  ',
      owner: ' platform-team ',
      repository: ' https://github.com/example/my-product ',
      tags: [' demo ', 'core'],
    });
    expectOk(result);
    expect(result.manifest).toEqual({
      name: 'my-product',
      version: '2.0.0-rc.1+build.5',
      description: 'Demo product',
      owner: 'platform-team',
      repository: 'https://github.com/example/my-product',
      tags: ['demo', 'core'],
    });
  });

  it('rejects non-object input', () => {
    for (const input of [null, 'nope', 42, ['my-product']]) {
      const result = validateManifest(input);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(fieldOf(result, 0)).toBe('');
      }
    }
  });

  it('requires a name', () => {
    const result = validateManifest({ version: '1.0.0' });
    expect(result.ok).toBe(false);
    expect(fieldOf(result, 0)).toBe('name');
  });

  it('requires a version', () => {
    const result = validateManifest({ name: 'my-product' });
    expect(result.ok).toBe(false);
    expect(fieldOf(result, 0)).toBe('version');
  });

  it('rejects blank names and versions', () => {
    const result = validateManifest({ name: '   ', version: '   ' });
    expect(result.ok).toBe(false);
    expect(fieldOf(result, 0)).toBe('name');
    expect(fieldOf(result, 1)).toBe('version');
  });

  it('rejects invalid name formats', () => {
    for (const name of ['My Product', 'my product', '-abc', 'abc-', 'my..product', 'Éléphant']) {
      const result = validateManifest({ ...validManifest, name });
      expect(result.ok, `expected "${name}" to be rejected`).toBe(false);
      expect(fieldOf(result, 0)).toBe('name');
    }
  });

  it('rejects non-semantic versions', () => {
    for (const version of ['1.0', 'v1.0.0', '1.0.0.0', 'one.two.three', '1.2.3-']) {
      const result = validateManifest({ ...validManifest, version });
      expect(result.ok, `expected "${version}" to be rejected`).toBe(false);
      expect(fieldOf(result, 0)).toBe('version');
    }
  });

  it('rejects optional fields of the wrong type', () => {
    const result = validateManifest({ ...validManifest, owner: 42 });
    expect(result.ok).toBe(false);
    expect(fieldOf(result, 0)).toBe('owner');
  });

  it('rejects empty optional strings', () => {
    const result = validateManifest({ ...validManifest, description: '   ' });
    expect(result.ok).toBe(false);
    expect(fieldOf(result, 0)).toBe('description');
  });

  it('rejects malformed tags', () => {
    for (const tags of ['demo', [1], [''], ['  ']]) {
      const result = validateManifest({ ...validManifest, tags });
      expect(result.ok, `expected tags ${JSON.stringify(tags)} to be rejected`).toBe(false);
      expect(fieldOf(result, 0)).toBe('tags');
    }
  });

  it('rejects more than 20 tags', () => {
    const result = validateManifest({ ...validManifest, tags: Array.from({ length: 21 }, () => 't') });
    expect(result.ok).toBe(false);
    expect(fieldOf(result, 0)).toBe('tags');
  });

  it('rejects unknown fields so typos never silently disappear', () => {
    const result = validateManifest({ ...validManifest, versoin: '1.0.0' });
    expect(result.ok).toBe(false);
    expect(fieldOf(result, 0)).toBe('versoin');
  });

  it('collects multiple errors in one pass', () => {
    const result = validateManifest({});
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toHaveLength(2);
    }
  });
});

describe('parseManifest', () => {
  it('returns the manifest when valid', () => {
    expect(parseManifest(validManifest)).toEqual({ name: 'my-product', version: '1.0.0' });
  });

  it('throws ManifestValidationError with all errors when invalid', () => {
    try {
      parseManifest({ name: 'Bad Name' });
      expect.unreachable('expected parseManifest to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(ManifestValidationError);
      if (error instanceof ManifestValidationError) {
        expect(error.name).toBe('ManifestValidationError');
        expect(error.errors).toHaveLength(2);
      }
    }
  });
});
