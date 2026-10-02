# product-platform

Free product build, test, release, deployment and monitoring platform.

**Status: Phase 1 — foundation.** This phase delivers the typed domain model, the
platform contracts (ports), an in-memory product registry, a minimal CLI, unit
tests, and architecture documentation. No deployment, GitHub, Vercel, cloud,
auth, or dashboard functionality is included yet — deliberately.

## What the platform manages

```
REGISTER → BUILD → TEST → RELEASE → DEPLOY → HEALTH CHECK → MONITOR → ROLLBACK
```

Phase 1 implements the **REGISTER** stage end to end and defines the contracts
every later stage will implement.

## Quickstart

Requires Node.js >= 18.17.

```bash
npm install
npm run typecheck
npm test
npm run build

# CLI (uses the build output)
node dist/cli/main.js --help
node dist/cli/main.js register --name demo-product --version 1.0.0 --owner platform --tag demo
node dist/cli/main.js list

# or via npm script
npm run cli -- register --name demo-product --version 1.0.0
npm run cli -- list --json
```

## Project structure

```
src/
  index.ts                 Public API barrel
  core/                    Domain core
    lifecycle.ts           Lifecycle stages + statuses (REGISTER…ROLLBACK)
    product.ts             Product, ProductId
    stage.ts               Shared StageResult shape for all stage results
    manifest/              ProductManifest type + validation (product contract)
    registry/              ProductRegistry port + InMemoryProductRegistry
    storage/               Storage port + InMemoryStorage adapter
    build/                 BuildEngine port (interface only)
    test/                  TestEngine port (interface only)
    release/               ReleaseManager port (interface only)
    deployment/            DeploymentProvider port (interface only)
    health/                HealthChecker port (interface only)
  cli/                     Minimal CLI (register / list / help)
tests/
  unit/                    Unit tests: manifest validation, registry, storage
docs/
  architecture.md          Architecture and design decisions
  product-contract.md      ProductManifest specification
```

## Architecture at a glance

The platform is organized as a small **ports and adapters** system:

- **Domain** — plain types: `Product`, `ProductManifest`, lifecycle
  stages/statuses, shared `StageResult`.
- **Ports (interfaces)** — `ProductRegistry`, `Storage`, `BuildEngine`,
  `TestEngine`, `ReleaseManager`, `DeploymentProvider`, `HealthChecker`.
  These are stable contracts; later phases add implementations without
  changing callers.
- **Adapters (implementations)** — Phase 1 ships `InMemoryProductRegistry`
  (Storage-backed) and `InMemoryStorage`. Engines/providers for build, test,
  release, deploy and health arrive in later phases behind the same ports.
- **Application** — the CLI. It depends only on the registry port.

Validation happens at the boundary: `registry.register()` parses and validates
every manifest against the product contract before anything is stored.

See [docs/architecture.md](docs/architecture.md) for details and
[docs/product-contract.md](docs/product-contract.md) for the manifest
specification.

## Scripts

| Script               | Purpose                                  |
| -------------------- | ---------------------------------------- |
| `npm run typecheck`  | Strict typecheck of `src/` and `tests/`  |
| `npm test`           | Run unit tests (Vitest)                  |
| `npm run build`      | Compile `src/` to `dist/` (ESM + d.ts)   |
| `npm run cli`        | Run the built CLI                        |

## Known limitations (Phase 1)

- The registry is **in-memory**: state lives for the duration of one process,
  so `register` and `list` in separate CLI invocations do not share state.
  Persistent storage is the next phase, and the `Storage` port already exists
  for it.
- Only the REGISTER stage exists; build, test, release, deploy, health,
  monitor and rollback are contract-only.
- No GitHub/Vercel/cloud integrations, no auth, no dashboard — out of scope
  for Phase 1 by design.

## Roadmap

1. **Phase 1 (this)** — foundation: domain, contracts, in-memory registry,
   CLI, tests, docs.
2. **Phase 2** — persistent `Storage` implementation (file-backed) used by the
   same registry.
3. **Phase 3** — `BuildEngine` implementation and artifact model.
4. **Phase 4** — `TestEngine` implementation with test summaries.
5. **Phase 5** — `ReleaseManager` implementation (versioning, changelogs).
6. **Phase 6** — `DeploymentProvider` + `HealthChecker` implementations.
7. **Phase 7** — monitor and rollback automation on the same lifecycle types.
