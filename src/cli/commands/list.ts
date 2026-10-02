import { InMemoryProductRegistry } from '../../core/registry/index.js';
import { assertNoPositionals, hasFlag, type ParsedInvocation } from '../args.js';

export async function listCommand(invocation: ParsedInvocation): Promise<number> {
  assertNoPositionals(invocation, 'list');
  const asJson = hasFlag(invocation.flags, 'json');

  const registry = new InMemoryProductRegistry();
  const products = await registry.list();

  if (asJson) {
    console.log(JSON.stringify({ products }, null, 2));
    return 0;
  }

  if (products.length === 0) {
    console.log('No products registered yet.');
    console.log('Run: product-platform register --name <name> --version <version>');
    return 0;
  }

  const headers = ['NAME', 'VERSION', 'STAGE', 'ID', 'CREATED'] as const;
  const rows = products.map((product) => [
    product.manifest.name,
    product.manifest.version,
    product.stage,
    product.id,
    product.createdAt,
  ]);
  console.log(formatTable(headers, ...rows));
  console.log(`${products.length} product(s). Registry state is in-memory in Phase 1.`);
  return 0;
}

function formatTable(headers: readonly string[], ...rows: string[][]): string {
  const widths = headers.map((header, column) =>
    Math.max(header.length, ...rows.map((row) => row[column]?.length ?? 0)),
  );
  const line = (cells: readonly string[]): string =>
    cells.map((cell, column) => cell.padEnd(widths[column] ?? 0)).join('  ').trimEnd();
  return [line(headers), ...rows.map(line)].join('\n');
}
