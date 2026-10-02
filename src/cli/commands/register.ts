import { ManifestValidationError } from '../../core/manifest/index.js';
import type { Product } from '../../core/product.js';
import { DuplicateProductError, InMemoryProductRegistry } from '../../core/registry/index.js';
import {
  assertNoPositionals,
  hasFlag,
  optionalFlag,
  repeatableFlag,
  requireFlag,
  type ParsedInvocation,
} from '../args.js';

export async function registerCommand(invocation: ParsedInvocation): Promise<number> {
  assertNoPositionals(invocation, 'register');
  const asJson = hasFlag(invocation.flags, 'json');

  const input = {
    name: requireFlag(invocation.flags, 'name'),
    version: requireFlag(invocation.flags, 'version'),
    description: optionalFlag(invocation.flags, 'description'),
    owner: optionalFlag(invocation.flags, 'owner'),
    repository: optionalFlag(invocation.flags, 'repository'),
    tags: repeatableFlag(invocation.flags, 'tag'),
  };

  const registry = new InMemoryProductRegistry();

  try {
    const product = await registry.register(input);
    if (asJson) {
      console.log(JSON.stringify({ product }, null, 2));
    } else {
      printProduct(product);
    }
    return 0;
  } catch (error) {
    if (error instanceof ManifestValidationError) {
      console.error('✖ Invalid product manifest:');
      for (const manifestError of error.errors) {
        console.error(`  - ${manifestError.field || '(root)'}: ${manifestError.message}`);
      }
      return 1;
    }
    if (error instanceof DuplicateProductError) {
      console.error(`✖ ${error.message}`);
      return 1;
    }
    throw error;
  }
}

function printProduct(product: Product): void {
  console.log(`✔ Registered product "${product.manifest.name}"`);
  console.log(`  id:       ${product.id}`);
  console.log(`  name:     ${product.manifest.name}`);
  console.log(`  version:  ${product.manifest.version}`);
  console.log(`  stage:    ${product.stage}`);
  console.log(`  created:  ${product.createdAt}`);
  console.log('  note:     registry state is in-memory in Phase 1');
}
