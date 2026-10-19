# Client Plan: Client: core library

Main plan: [plan.md](plan.md)

## Overview
Build the core described in [`docs/agents/specs/client/library.md`](../../specs/client/library.md)
(Configuration, Module layout, Core, Pagination, Errors, Retries and timeouts, Testing strategy).
The resource wrappers (#1609, #1621–#1623) and the CLI are out of scope; `MajoraClient` only
exposes `http` and `paginator` for them.

## Context
- `client/` was scaffolded by #1607: `package.json` (`"type": "module"`, `main: src/index.js`,
  Jasmine + c8 + ESLint 9), a placeholder `src/index.js` (`PACKAGE_NAME` / `packageName`) and
  `specs/index_spec.js`.
- ESLint enforces JSDoc (description, params, returns) on public classes/methods/functions,
  `complexity` ≤ 10, `max-lines` ≤ 300, `max-depth` ≤ 4, single quotes, semicolons, 2-space
  indent. Keep classes small; one class per file, PascalCase.
- Jasmine runs `specs/**/*[sS]pec.js` in random order; specs mirror `src/` under `specs/`.
- No runtime dependencies; Node 20+ natives only (`fetch`, `FormData`, `Blob`,
  `AbortSignal.timeout`, `AbortSignal.any`).
- No spec may make a real network call or patch globals: `fetch`, the environment and the
  retry sleep are all injected.

## Steps

- [01 — Error hierarchy](client/01-error-hierarchy.md)
- [02 — Configuration](client/02-configuration.md)
- [03 — HttpClient requests and error mapping](client/03-http-client.md)
- [04 — Timeouts and retries](client/04-timeouts-and-retries.md)
- [05 — Page and Paginator](client/05-page-and-paginator.md)
- [06 — MajoraClient and public exports](client/06-majora-client-and-exports.md)
- [07 — Documentation](client/07-documentation.md)

## CI Checks
- `client/`: `make client-coverage` (CI job: `client_tests`)
- `client/`: `make client-lint` and `npm pack --dry-run` inside `make client` (CI job: `client_checks`)

## Notes
- Every request in this core targets `<baseUrl>/<path>.json`; callers pass paths without the
  `.json` suffix (e.g. `games/epic-quest/npcs/all`). Decide once in step 03 and document it in
  the `HttpClient` JSDoc so #1609 follows it.
- Token safety is a hard requirement: add a spec that serializes every error type
  (`message`, `JSON.stringify`, own properties) and asserts the token string never appears.
- Pagination is offset-based; the skip/repeat limitation is documented, not worked around.
