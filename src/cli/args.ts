/** Usage-level error; the CLI prints it and exits with code 2. */
export class CliError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CliError';
  }
}

export type FlagValue = string | true;
export type FlagMap = Map<string, FlagValue[]>;

export interface ParsedInvocation {
  /** First positional argument, if any. */
  readonly command: string | undefined;
  readonly flags: FlagMap;
  /** Positional arguments after the command. */
  readonly positionals: string[];
}

/**
 * Minimal argv parser: `--flag value`, `--flag=value`, bare `--flag`
 * (boolean), repeatable flags and `-h/--help`. Unknown single-dash options
 * are rejected.
 */
export function parseArgs(argv: readonly string[]): ParsedInvocation {
  const flags: FlagMap = new Map();
  const positionals: string[] = [];

  const addFlag = (key: string, value: FlagValue): void => {
    const existing = flags.get(key);
    if (existing === undefined) {
      flags.set(key, [value]);
    } else {
      existing.push(value);
    }
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === undefined) break;

    if (arg === '-h' || arg === '--help') {
      addFlag('help', true);
      continue;
    }

    if (arg.startsWith('--')) {
      const equalsIndex = arg.indexOf('=');
      if (equalsIndex !== -1) {
        const key = arg.slice(2, equalsIndex);
        if (key.length === 0) {
          throw new CliError(`Invalid option: "${arg}".`);
        }
        addFlag(key, arg.slice(equalsIndex + 1));
      } else {
        const key = arg.slice(2);
        if (key.length === 0) {
          throw new CliError('Invalid option: "--".');
        }
        const next = argv[index + 1];
        if (next !== undefined && !next.startsWith('-')) {
          addFlag(key, next);
          index += 1;
        } else {
          addFlag(key, true);
        }
      }
      continue;
    }

    if (arg.startsWith('-')) {
      throw new CliError(`Unknown option: "${arg}". Run "product-platform --help" for usage.`);
    }

    positionals.push(arg);
  }

  const [command, ...rest] = positionals;
  return { command, flags, positionals: rest };
}

export function hasFlag(flags: FlagMap, key: string): boolean {
  return flags.has(key);
}

/** Last value of a required value-taking option. */
export function requireFlag(flags: FlagMap, key: string): string {
  const values = flags.get(key);
  const value = values === undefined ? undefined : values[values.length - 1];
  if (value === undefined) {
    throw new CliError(`Missing required option --${key}.`);
  }
  if (value === true) {
    throw new CliError(`Option --${key} requires a value.`);
  }
  return value;
}

/** Last value of an optional value-taking option, if provided. */
export function optionalFlag(flags: FlagMap, key: string): string | undefined {
  if (!flags.has(key)) {
    return undefined;
  }
  return requireFlag(flags, key);
}

/** All values of a repeatable option, in order. */
export function repeatableFlag(flags: FlagMap, key: string): string[] {
  const values = flags.get(key);
  if (values === undefined) {
    return [];
  }
  return values.map((value) => {
    if (value === true) {
      throw new CliError(`Option --${key} requires a value.`);
    }
    return value;
  });
}

/** Reject stray positional arguments after the command. */
export function assertNoPositionals(invocation: ParsedInvocation, command: string): void {
  if (invocation.positionals.length > 0) {
    const first = invocation.positionals[0] ?? '';
    throw new CliError(`Unexpected argument "${first}" for command "${command}".`);
  }
}
