# Architect Plan: Client: scaffold client/, docker-compose service and CI

Main plan: [plan.md](plan.md)

## Shared contracts

- **Rely on** the `majora_client` service and the make targets `client`, `client-install`,
  `client-tests`, `client-lint`, `client-coverage` (infra), and the `client_tests` /
  `client_checks` CI jobs.
- **Produce** the markdownlint ignore `client/node_modules/**`.

## Implementation Steps

### Step 1 — Repository config

- `.markdownlint-cli2.jsonc`: add `client/node_modules/**` to `ignores`.
- `.codacy.yml`: exclude `client/specs/**` from `duplication` and `pmd`, as is already done for
  `frontend/specs/**`.

### Step 2 — Docs and agent files

- `AGENTS.md`, Development section: a short paragraph on the `majora_client` service (no host
  Node.js, no stack needed for tests) and its `make client*` targets, covered by the
  `client_tests` and `client_checks` CI jobs (same style as the `crawler_navi_web` paragraph).
- `.claude/agents/client.md`: drop "`client/` does not exist yet; it is scaffolded by #1607." and
  "These targets only exist once #1607 lands."
- `.claude/agents/infra.md`: add a `majora_client` row to the services table
  (`darthjee/node:0.2.1`, no port, "Majora client (`client/`) lint/tests and manual CLI runs").
- `docs/agents/specs/client/packaging.md`: note that #1607 is implemented.

## Files to Change

- `.markdownlint-cli2.jsonc` — ignore `client/node_modules/**`
- `.codacy.yml` — exclude `client/specs/**`
- `AGENTS.md` — Development note
- `.claude/agents/client.md` — drop the "not yet" notes
- `.claude/agents/infra.md` — services table row
- `docs/agents/specs/client/packaging.md` — status note

## CI Checks

- Root: `make` markdownlint run via `docker-compose run --rm markdownlint` (CI job: `markdownlint`)

## Notes

- Run last, after the infra and client work, so the docs describe what actually landed.
