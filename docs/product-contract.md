# Product Contract

The **product manifest** is the single source of truth describing a product on
the platform. It is what gets registered, and later built, tested, released,
deployed and monitored. This document specifies its exact shape and rules as
enforced by `validateManifest` / `parseManifest`
(`src/core/manifest/validation.ts`).

## Fields

| Field         | Type       | Required | Rules                                                                    | Example                              |
| ------------- | ---------- | -------- | ------------------------------------------------------------------------ | ------------------------------------ |
| `name`        | `string`   | yes      | 1–64 chars; lowercase `a–z`, `0–9`; segments separated by `.`, `_`, `-`; separators only *between* segments | `billing-service` |
| `version`     | `string`   | yes      | Strict semver `MAJOR.MINOR.PATCH`, optional `-prerelease` and `+build` suffixes | `1.4.2`, `2.0.0-rc.1`   |
| `description` | `string`   | no       | Non-empty when provided                                                   | `Customer billing API`               |
| `owner`       | `string`   | no       | Non-empty when provided                                                   | `platform-team`                      |
| `repository`  | `string`   | no       | Non-empty when provided; intended to be a URL                             | `https://github.com/example/billing` |
| `tags`        | `string[]` | no       | At most 20 entries; each entry a non-empty string                         | `["api", "billing"]`                 |

Additional rules:

- **Unknown fields are rejected.** A typo such as `versoin` is an error, not a
  silently ignored key. New fields must be added to the schema explicitly.
- **Values are trimmed.** Leading/trailing whitespace is removed before
  validation and storage (`" my-product "` registers as `my-product`).
- **Optional means omissible.** Passing `undefined` is equivalent to omitting
  the field; passing an empty or blank string is an error.

## Examples

Valid minimal manifest:

```json
{
  "name": "billing-service",
  "version": "1.4.2"
}
```

Valid full manifest:

```json
{
  "name": "billing-service",
  "version": "2.0.0-rc.1",
  "description": "Customer billing API",
  "owner": "platform-team",
  "repository": "https://github.com/example/billing-service",
  "tags": ["api", "billing"]
}
```

Invalid manifest (collected errors):

```json
{
  "name": "Billing Service",
  "version": "1.0",
  "tags": []
}
```

`validateManifest` returns:

```json
{
  "ok": false,
  "errors": [
    { "field": "name", "message": "name must be lowercase letters and digits separated by \".\", \"_\" or \"-\" (e.g. \"my-product\")." },
    { "field": "version", "message": "version must be semantic (MAJOR.MINOR.PATCH), ..." }
  ]
}
```

Note: `tags: []` is valid (empty means "no tags") and is stored as omitted.

## The registered Product record

On successful registration the registry assigns platform metadata and stores a
`Product`:

```json
{
  "id": "3f2c9a1e-8f4b-4c2a-9d1e-7b6a5c4d3e2f",
  "manifest": { "name": "billing-service", "version": "1.4.2" },
  "stage": "register",
  "createdAt": "2026-10-02T12:00:00.000Z",
  "updatedAt": "2026-10-02T12:00:00.000Z"
}
```

- `id` — UUID v4, the immutable primary key.
- `manifest` — the validated, normalized manifest.
- `stage` — current lifecycle stage; always starts at `register`.
- `createdAt` / `updatedAt` — ISO 8601 UTC timestamps.

## Identity rules

- `id` is globally unique and immutable.
- `name` is unique across the registry; registering a duplicate name fails
  with `DuplicateProductError`.
- Phase 1 has no update operation: manifests are immutable once registered.
  Update/upgrade flows arrive with later phases.

## Lifecycle vocabulary

Stages, in execution order:

```
register → build → test → release → deploy → health_check → monitor → rollback
```

Statuses shared by all stage results:

```
pending | in_progress | succeeded | failed | skipped | cancelled
```

## Evolution policy

The contract evolves **additively**: new fields must be optional and must not
change the meaning of existing fields. Breaking changes (required fields,
changed formats, removed fields) require a major platform version and a
migration note in this document.
