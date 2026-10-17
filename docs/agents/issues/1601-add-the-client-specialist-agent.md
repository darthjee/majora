# Issue: Add the client specialist agent

## Description

Part of epic #1592 (Majora client for automations, with fine-grained API tokens). The design is
recorded in the client spec: [`docs/agents/specs/client.md`](../specs/client.md) and its aspect
pages under `docs/agents/specs/client/`.

Add a `client` specialist agent that owns the new top-level `client/` folder. That folder will hold
the Node.js Majora client: the library, the CLI and the public npm package `majora-client`. Copy the
`crawler` agent setup (`.claude/agents/crawler.md`, `docs/agents/crawler.md`).

## Problem

The client track (#1607 to #1611 and #1621 to #1623) assigns work to a `client` agent that does not
exist yet. Without it, the architect has no specialist to send `client/` work to. The name `client`
could also be confused with the SPA API clients in `frontend/assets/js/client/`.

## Expected Behavior

- A `client` agent is defined, documented and listed wherever the other agents are listed.
- The architect sends all `client/` work to it.
- The docs say clearly where `client/` stops and the `infra` and `frontend` areas begin.

## Solution

### `.claude/agents/client.md`

- Frontmatter: `name: client`, a description that names `client/` (the Node.js library, CLI and
  npm package that uses scoped API tokens), and `tools: Read, Edit, Write, Bash`.
- **Scope:** everything under `client/`: `src/` (the library and `src/cli/`), `bin/`, `specs/`
  (Jasmine), `eslint.config.mjs`, `package.json` (scripts, `files`, `bin`, `engines`, `version`),
  `yarn.lock` and `README.md`.
- **Do NOT touch:** `backend/`, `frontend/`, `proxy/`, `crawler/`, `navi/`, `docker-compose.yml`,
  `dockerfiles/`, `.circleci/`, `scripts/` and `Makefile`. The `majora_client` service, the
  `client*` Makefile targets, the `client_tests`, `client_checks` and `client-release` CI jobs and
  `scripts/bump_version.sh client` belong to `infra`, as in the [packaging spec](../specs/client/packaging.md).
- **Tooling:** run everything through the `majora_client` service and the `make client*`
  targets (`client-install`, `client-tests`, `client-lint`, `client-coverage`, `client`), never on
  the host. Until #1607 lands, those targets do not exist yet.
- **Rules from the spec** the agent must follow: no runtime dependencies (dev dependencies only),
  Node 20 or later, HTTPS only unless `--allow-insecure-http` is passed, and the
  `Authorization: Bearer mjr_...` scoped token (not the legacy all-access `Token` used by `crawler/`).
- **Sources:** work from the client spec (`docs/agents/specs/client.md` and
  `docs/agents/specs/client/*.md`). For request and response shapes, use the API guides under
  `docs/guides/majora/`.
- **Naming:** `client/` is unrelated to `frontend/assets/js/client/` (the SPA API clients
  `BaseClient`, `GameClient` and so on). That folder stays with `frontend`, and the two share no code.

### `docs/agents/client.md`

Explain why the agent exists and how the client relates to the API, the scoped tokens
(`tokens.md`, `scopes.md`) and the `crawler` (unchanged, still on the legacy token). Repeat the
naming note. Point to the spec as the current source of truth, and say that #1612 moves this
reference to permanent docs before the spec is removed in #1613.

### Rosters and indexes

- `.claude/agents/architect.md`: add a `client` row to the agent roster table and a `client.md`
  row to the docs table, next to the `crawler` entries.
- `AGENTS.md`: add a `client` row to the documentation table.
- `docs/agents/index.md`: add a "Client Agent" link.
- `docs/agents/folder-structure.md`: add a `client/` row (not created yet, owned by the `client`
  agent and scaffolded by #1607), and add `client.md` to the list of top-level docs.
- Add `client/` to the "Do NOT touch" lists of the other agents that have one (`crawler`, `proxy`;
  `infra` too, which keeps only the compose, CI and Makefile wiring).

### Out of scope

Any file under `client/`. The scaffold comes in #1607.

## Benefits

- Work in `client/` has a clear owner from the first implementation issue (#1607).
- The boundaries with `infra` and `frontend` are written down, so there is less confusion
  between the two `client` folders.
