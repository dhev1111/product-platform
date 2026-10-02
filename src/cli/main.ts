#!/usr/bin/env node
import { CliError, parseArgs, type ParsedInvocation } from './args.js';
import { registerCommand } from './commands/register.js';
import { listCommand } from './commands/list.js';

const USAGE = `product-platform — register and manage products (Phase 1)

Usage:
  product-platform register --name <name> --version <version> [options]
  product-platform list [--json]
  product-platform help

Commands:
  register   Validate a product manifest and register the product
  list       List registered products
  help       Show this help

Register options:
  --name <name>          Required. Lowercase slug, e.g. "my-product"
  --version <version>    Required. Semantic version, e.g. "1.0.0"
  --description <text>   Optional. Human-readable summary
  --owner <owner>        Optional. Accountable team or person
  --repository <url>     Optional. Source repository URL
  --tag <tag>            Optional. Repeatable label
  --json                 Print machine-readable JSON

Global options:
  --json                 Print machine-readable JSON
  -h, --help             Show help

Exit codes:
  0  success
  1  validation or registry error
  2  usage error

Note: the registry is in-memory in Phase 1 — registered products live for
the duration of a single CLI process. Persistence arrives in Phase 2.`;

async function run(argv: readonly string[]): Promise<number> {
  let invocation: ParsedInvocation;
  try {
    invocation = parseArgs(argv);
  } catch (error) {
    return fail(error);
  }

  if (invocation.flags.has('help') || invocation.command === 'help') {
    console.log(USAGE);
    return 0;
  }

  switch (invocation.command) {
    case 'register':
      return registerCommand(invocation);
    case 'list':
      return listCommand(invocation);
    case undefined:
      console.error(USAGE);
      return 2;
    default:
      console.error(`Unknown command: "${invocation.command}".\n`);
      console.error(USAGE);
      return 2;
  }
}

function fail(error: unknown): number {
  if (error instanceof CliError) {
    console.error(`error: ${error.message}`);
    return 2;
  }
  console.error(error);
  return 1;
}

const exitCode = await run(process.argv.slice(2)).catch(fail);
process.exitCode = exitCode;
