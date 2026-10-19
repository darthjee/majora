# Plan: Client: CLI

Issue: [1610-client-cli.md](../../issues/1610-client-cli.md)

## Overview

Implement the `majora` command-line tool shipped in the `majora-client` package. It parses
`majora <resource> <action> [<id>] [flags]` with `util.parseArgs` (strict), builds a
`MajoraClient`, delegates to one library call and prints JSON / NDJSON. It adds no logic and no
dependency. The spec [`docs/agents/specs/client/cli.md`](../../specs/client/cli.md) is the single
source of truth for commands, flags, output, exit codes and edge cases: follow it exactly,
because once published it is a semver public contract.

## Context

- The library (#1608, #1609) already exposes everything the CLI needs:
  - `new MajoraClient({ baseUrl, token, timeout, retries, fetch, allowInsecureHttp, env })`,
    which throws `ConfigurationError` on missing/invalid/insecure config;
  - `client.games` (`list`, `iterate`, `mine`, `get(slug)`) and `client.game(slug)` with
    `npcs`, `pcs`, `factions`, `items`, `documents` (`list`, `iterate`, `get`, `create`,
    `update`);
  - per-call options `restricted`, `page`, `perPage`, `query`, `timeout`, `retries`, `signal`;
  - `list` returns a `Page` with `data`, `page`, `pages`, `perPage`, `total`;
  - missing actions/variants throw `UsageError` before any request (`pcs create`,
    `pcs list --restricted`, `games --restricted`);
  - error classes exported from `src/index.js`: `MajoraError`, `ConfigurationError`,
    `UsageError`, `NetworkError`, `ApiError` and its subclasses `ValidationError` (`fields`),
    `AuthenticationError`, `PermissionError`, `NotFoundError`, `ServerError`.
- `client/package.json` already lists `bin/` in `files` but has no `bin` field and no `bin/`
  folder. `lint` runs `eslint src specs`; c8 covers `src/**/*.js`.
- Specs use Jasmine (`specs/support/jasmine.json`) and the injectable
  `specs/support/FetchStub.js` (`reply`, `fail`, `handleWith`, recorded `calls`).

## Steps

- [01 — Argument parsing and command registry](client/01-argument-parsing-and-command-registry.md)
- [02 — Body reader and output writer](client/02-body-reader-and-output-writer.md)
- [03 — Exit codes, help text and the Cli runner](client/03-exit-codes-help-and-cli-runner.md)
- [04 — Executable, package wiring and smoke spec](client/04-executable-package-wiring-and-smoke-spec.md)
- [05 — Documentation](client/05-documentation.md)

## CI Checks

- `client/`: `make client-lint` (CI job: `client_checks`)
- `client/`: `make client-tests` / `make client-coverage` (CI job: `client_tests`)

## Notes

- Never run Node or yarn on the host; use the `majora_client` service through `make`.
- Token safety is a hard requirement: no `--token` flag, and a spec must assert that no stdout,
  stderr, `--debug` or `--help` output contains the token on any path (use a recognizable fake
  token such as `mjr_secret_token_value` and check every captured stream).
- `--debug` prints stack traces only; it must never print request headers or the config object.
- Out of scope: document pages (#1621), link routes (#1622), photo uploads (#1623), a raw
  `majora request` command, tables or a `--format` flag.
- Decision left to the implementer, within the spec: `--game` on the top-level `games`
  resource is ignored (not an error), since `games` is not game-scoped.
