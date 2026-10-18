# Issue: Client: scaffold client/, docker-compose service and CI

## Description

Part of epic #1592 (Majora client for automations, with fine-grained API tokens). Scaffold the
new root `client/` folder and wire it into development and CI, exactly as settled by #1600 in
[`docs/agents/specs/client/packaging.md`](../specs/client/packaging.md). `client/` is owned by the
`client` agent; the wiring outside it (docker-compose, `.gitignore`, Makefile, CircleCI) is owned
by `infra`.

Out of scope: library and CLI code (#1608 and later), the `client-release` job and the
`scripts/bump_version.sh client <X.Y.Z>` form (#1611).

## Problem

The client sub-issues of #1592 need a place to live and a way to lint, test and gate their code.
`client/` does not exist yet, and the `client` agent's documented `make client-*` targets are not
defined.

## Expected Behavior

- `make client-install`, `make client-lint`, `make client-tests` and `make client-coverage` run
  through the `majora_client` service, with no Node.js on the host and without booting the stack.
- `make client` opens a shell in the `majora_client` container.
- CircleCI runs `client_tests` and `client_checks` on every push and tag, and both gate every app
  release job and `coverage-final`.
- A placeholder Jasmine spec passes, and ESLint and `npm pack --dry-run` are clean.

## Solution

### `client/` (client agent)

- `client/package.json`: name `majora-client`, version `0.1.0`, `"type": "module"`,
  `engines.node: ">=20"`, `files: ["src/", "bin/", "README.md"]`, public (no `private`), and the
  scripts `test` (Jasmine), `lint` (ESLint) and `coverage` (c8 around Jasmine, lcov output). No
  `bin` entry yet (the CLI comes in a later sub-issue). Dev dependencies only.
- `client/specs/support/jasmine.json` and one placeholder spec under `client/specs/`.
- `client/src/` with a minimal placeholder module, so `files` and the coverage report are not empty.
- `client/eslint.config.mjs`: ESLint 9 flat config mirroring the frontend's plugins minus the
  React-specific ones (jsdoc, jasmine, security, security-node, complexity, no-unsanitized).
- Committed `client/yarn.lock`.
- `client/README.md`: what the package is, the development commands, and a pointer to the spec.

### Wiring outside `client/` (infra agent)

- `docker-compose.yml`: the `majora_client` service exactly as in the spec (`image:
  darthjee/node:0.2.1`, `client` and `docker_volumes/client_node_modules` volumes, `MAJORA_URL`,
  `MAJORA_TOKEN`, `MAJORA_GAME`; no `build`, `depends_on`, `ports` or `command`).
- `.gitignore`: `docker_volumes/client_node_modules/`.
- `Makefile`: `client`, `client-install`, `client-tests`, `client-lint` and `client-coverage` under a
  new `# ── Client ──` section, added to `.PHONY`.
- `.circleci/config.yml`:
  - `client_tests` (`darthjee/circleci_node:0.2.1`, `filters: *all_tags`): `yarn install
    --frozen-lockfile`, `yarn coverage`, and a partial Codacy upload of the lcov report, with file
    paths resolving relative to the repository root.
  - `client_checks` (same image and filters): `yarn install --frozen-lockfile`, `yarn lint`, and
    `npm pack --dry-run`.
  - Both added to the shared `requires` list of every app release job; `coverage-final` requires
    `client_tests`. Neither depends on the base-image release jobs.

### Documentation

- `AGENTS.md` Development section: a short note on the `majora_client` service and its `make
  client-*` targets.
- Drop the "does not exist yet" / "only exist once #1607 lands" notes from
  `.claude/agents/client.md` and `docs/agents/client.md`.
- `docs/agents/specs/client/packaging.md`: mark #1607 as implemented.

### Acceptance criteria

- The make targets above work from a clean checkout (after `make client-install`).
- Both CI jobs are green on the PR and appear in the release jobs' and `coverage-final`'s
  `requires` lists.

## Benefits

The later client sub-issues (#1608 onwards) can focus on library code, with lint, tests,
packaging checks and coverage already enforced from the first commit.
