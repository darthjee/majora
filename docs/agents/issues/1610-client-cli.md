# Issue: Client: CLI

## Description

Part of epic #1592 (Majora client for automations, with fine-grained API tokens). Add the thin
`majora` command-line tool on top of the client library (#1608 core, #1609 resource wrappers),
shipped in the same `majora-client` npm package. The full design is settled in
[`docs/agents/specs/client/cli.md`](../specs/client/cli.md) (refined by #1599); this issue
implements it. Owning agent: `client`.

## Problem

The library can only be used from JavaScript. Users who want to script or debug against the
Majora API from a shell with a scoped token (`mjr_...`) have no tool for it, and the package
`files` already lists a `bin/` folder that does not exist yet.

## Expected Behavior

- `majora <resource> <action> [<id>] [flags]`, for example `majora npcs list --game epic-quest`,
  `majora npcs get 12 --game epic-quest --restricted`, `majora games get epic-quest`.
- Commands cover the #1609 plain resources only:
  - `games`: `list`, `mine`, `get`;
  - `npcs`, `factions`, `items`, `documents`: `list`, `get`, `create`, `update`;
  - `pcs`: `list`, `get`, `update`.

  Document pages (#1621), link routes (#1622) and photo uploads (#1623) are out of scope. There
  is no raw `majora request` escape hatch.
- Configuration: `MAJORA_URL` / `MAJORA_TOKEN` from the environment, overridden by `--url` and
  `--token-file` (whitespace trimmed). `MAJORA_GAME` is the fallback for `--game`; a
  game-scoped command with neither fails with a usage error. There is **no `--token` flag**.
- Flags: `--url`, `--token-file`, `--allow-insecure-http`, `--game`, `--restricted`, `--page`,
  `--per-page`, `--all`, `--meta`, repeatable `--query key=value`,
  `--data <json | @file | ->` (must be a JSON object), `--timeout`, `--retries`, `--debug`,
  `--help` (global and per resource), `--version`.
- Output: stdout is JSON only, pretty-printed with 2 spaces. `get` / `create` / `update` print
  the returned object; `list` prints the page `data` array (`[]` when empty), or
  `{ data, page, pages, perPage, total }` with `--meta`; `list --all` streams NDJSON through
  `iterate` (nothing printed when empty, never prefetched).
- Errors: one line with the error `message` on stderr (plus `fields` for a `ValidationError`),
  stack traces only with `--debug`. Exit codes: 0 success, 1 internal, 2 usage /
  `UsageError` / `ConfigurationError` / bad `--data`, 3 401, 4 403, 5 404, 6 400, 7 other
  `ApiError`, 8 5xx, 9 `NetworkError` (incl. timeouts), 130 SIGINT.
- Usage errors (exit 2): unknown resource or action, an action the resource lacks
  (`pcs create`), missing `<id>`, `--data` on a read, `--all` with `--page`, `--restricted` on a
  family without that variant (library `UsageError`), invalid or non-object `--data`.
- `EPIPE` on stdout (e.g. `| head`) stops quietly with exit 0; SIGINT during `--all` aborts the
  in-flight request (via the library `signal` option) and exits 130.
- The token never appears in any output: stdout, stderr, `--debug` or `--help`.

## Solution

Follow the spec's internal layout, one PascalCase class per file, no new runtime dependency:

```text
client/bin/majora.js        # shim: process.exitCode = await new Cli({ ...process io }).run(argv)
client/src/cli/
  Cli.js                    # run(argv) -> exit code; env, stdin, stdout, stderr, fetch injected
  ArgumentParser.js         # util.parseArgs (strict) -> { resource, action, id, options }
  CommandRegistry.js        # resource -> actions, game-scoped or not, library accessor
  BodyReader.js             # --data: inline / @file / stdin, must be a JSON object
  OutputWriter.js           # JSON, NDJSON, --meta
  ExitCodes.js              # error class -> exit code
  HelpText.js               # generated from CommandRegistry
```

- Add `"bin": { "majora": "bin/majora.js" }` to `client/package.json` (`bin/` is already in
  `files`), make the shim executable with a `#!/usr/bin/env node` shebang, and extend the
  `lint` / `lint_fix` scripts to cover `bin`.
- Every command delegates to `MajoraClient` (`client.games` / `client.game(slug).<family>`),
  passing `env` and `fetch` through so specs need no globals.
- Jasmine specs under `client/specs/cli/`, mirroring `src/cli/`, running `Cli.run` with the
  `specs/support/FetchStub.js` stub and fake io streams. Cover argument parsing per command,
  `--game` / `MAJORA_GAME`, `--token-file`, the three `--data` sources, JSON / NDJSON / `--meta`
  output, the exit code of every error class, `EPIPE`, and that no output path contains the
  token. One smoke spec spawns `bin/majora.js --version` and `--help` via `child_process`.
- Add a CLI section to `client/README.md` (usage, configuration, flags, exit codes).
- Run everything through `make client-tests` / `make client-lint`; coverage must stay at the
  current level.

### Acceptance criteria

- Every command and flag listed in the spec works as described, and the specs above pass.
- `yarn lint` is clean over `src`, `specs` and `bin`.
- The command grammar, flags, exit codes and JSON output match the spec exactly: once
  published they are a semver public contract.

## Benefits

- Shell scripting and debugging against the Majora API with scoped tokens, with `jq`-friendly
  output and stable exit codes for automation.
- No logic duplicated from the library and no new dependency, so the CLI stays a thin,
  low-maintenance layer.
