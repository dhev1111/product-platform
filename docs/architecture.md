# Architecture

This document describes the Phase 1 architecture of `product-platform`: a
product deployment platform that will manage products through the lifecycle

```
REGISTER → BUILD → TEST → RELEASE → DEPLOY → HEALTH CHECK → MONITOR → ROLLBACK
```

## Goals of Phase 1

- A clean, strictly-typed TypeScript foundation.
- Core domain types: `Product`, `ProductManifest`, lifecycle stages/statuses.
- Stable contracts (ports) for every lifecycle capability.
- One working vertical slice: **register a product and list products** via an
  in-memory registry and a minimal CLI.
- Unit tests and documentation. Nothing else — no deployment, GitHub,
  Vercel, cloud, auth or dashboard work.

## Layering

```
                ┌─────────────────────────────────────────────┐
                │               CLI  (src/cli)                │
                │        register / list / help               │
                └──────────────────┬──────────────────────────┘
                                   │ depends only on ports
                ┌──────────────────▼──────────────────────────┐
                │           CORE DOMAIN  (src/core)           │
                │  Product · ProductManifest · lifecycle      │
                │  manifest validation · StageResult          │
                ├─────────────────────┬───────────────────────┤
                │  PORTS (interfaces) │  ADAPTERS (Phase 1)   │
                │  ProductRegistry    │  InMemoryProduct      │
                │  Storage            │    Registry           │
                │  BuildEngine        │  InMemoryStorage      │
                │  TestEngine         │                       │
                │  ReleaseManager     │  later phases plug    │
                │  DeploymentProvider │  in here without      │
                │  HealthChecker      │  touching callers     │
                └─────────────────────┴───────────────────────┘
```

Dependencies point inwards only: CLI → ports → domain. Implementations are
injected (the registry takes any `Storage`), so swapping adapters never
changes domain or application code.

## Module map

| Module                  | Purpose                                            | Status            |
| ----------------------- | -------------------------------------------------- | ----------------- |
| `src/core/lifecycle.ts` | Lifecycle stages and statuses as string unions     | implemented        |
| `src/core/product.ts`   | `Product`, `ProductId`                             | implemented        |
| `src/core/stage.ts`     | Shared `StageResult` for all stage results         | implemented        |
| `src/core/manifest/`    | `ProductManifest` + validation (product contract)  | implemented        |
| `src/core/registry/`    | `ProductRegistry` port                             | port implemented   |
|                         | `InMemoryProductRegistry`                          | implemented        |
| `src/core/storage/`     | `Storage` port                                     | port implemented   |
|                         | `InMemoryStorage` adapter                          | implemented        |
| `src/core/build/`       | `BuildEngine` port                                 | interface only     |
| `src/core/test/`        | `TestEngine` port                                  | interface only     |
| `src/core/release/`     | `ReleaseManager` port                              | interface only     |
| `src/core/deployment/`  | `DeploymentProvider` port                          | interface only     |
| `src/core/health/`      | `HealthChecker` port                               | interface only     |
| `src/cli/`              | CLI application (register, list, help)             | implemented        |
| `src/index.ts`          | Public library barrel                              | implemented        |

## Design decisions

1. **Ports and adapters.** Every lifecycle capability is an interface first.
   Phase 1 implements only the registry and its storage; future engines and
   providers (build runners, test runners, deploy targets) implement the same
   ports, and existing callers are untouched.

2. **Validation at the boundary.** `ProductRegistry.register()` accepts
   `unknown`, validates it against the product contract
   (`parseManifest`), and rejects invalid data with
   `ManifestValidationError` before anything is stored. Invalid products can
   therefore never enter the platform, no matter which client calls in.

3. **Storage-agnostic registry.** The registry persists products through the
   `Storage` port (`product:<id>` records plus a `product-name:<name>` unique
   index). `InMemoryStorage` is the Phase 1 default; a file- or
   database-backed store is a drop-in replacement.

4. **Lifecycle as data.** Stages (`register` … `rollback`) and statuses
   (`pending`, `in_progress`, `succeeded`, …) are string-literal unions.
   Every stage result extends `StageResult` and narrows its `stage` field, so
   results are serializable, comparable and type-discriminable across the
   whole pipeline.

5. **Strict TypeScript, zero runtime dependencies.** `strict` plus
   `noUncheckedIndexedAccess`, `noImplicitOverride`, `verbatimModuleSyntax`
   and friends. Runtime dependencies: none (Node stdlib only). Dev
   dependencies: `typescript`, `vitest`, `@types/node`.

6. **ESM-first, Node >= 18.17.** `"type": "module"` with `NodeNext`
   resolution; the CLI is a plain Node script (`dist/cli/main.js`).

## Data flow: registering a product

```
CLI argv
  → parseArgs (src/cli/args.ts)
  → registerCommand (src/cli/commands/register.ts)
      flags → manifest input
  → InMemoryProductRegistry.register (src/core/registry)
      → parseManifest: validate + normalize against the product contract
      → uniqueness check on the name index (Storage)
      → new Product { id, manifest, stage: 'register', createdAt, updatedAt }
      → persisted via Storage
  → printed as JSON or a formatted record
```

Errors map to CLI exit codes: `0` success, `1` validation/registry error
(`ManifestValidationError`, `DuplicateProductError`), `2` usage error
(`CliError`).

## Testing strategy

- Unit tests per module under `tests/unit/` (Vitest).
- Manifest validation tests cover required fields, formats, trimming,
  unknown-field rejection and multi-error aggregation.
- Registry tests cover registration, metadata assignment, uniqueness, lookup,
  listing order, removal and storage injection.
- Later phases add **contract tests**: each `BuildEngine` /
  `DeploymentProvider` / etc. implementation must pass the same suite so
  adapters stay interchangeable.

## Phase 1 non-goals

Deliberately excluded: deployment execution, GitHub integration, Vercel
integration, cloud infrastructure, authentication, dashboards, AI features,
and any changes to sibling projects (KANIYAN, Nexus Crew). These belong to
later phases of this repository only.
