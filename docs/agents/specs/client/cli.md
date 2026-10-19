# CLI

The thin command-line tool shipped with the [library](library.md), for quick scripting and
debugging. Part of the [client spec](../client.md) (epic #1592). Refined by #1599 and
implemented by #1610.

## Overview

The CLI lets a user call the Majora API from a shell with a scoped token, for example
`majora npcs list --game epic-quest`. It adds no logic of its own: every command maps onto a
library call.

## Decisions

- **Thin layer.** The CLI is built on the library and only parses arguments, calls the library
  and prints the result.
- **Same package.** It ships in the same npm package as the library (see
  [Packaging](packaging.md)).
- **Configuration.** It reads `MAJORA_URL` and `MAJORA_TOKEN` from the environment, the same
  fallbacks as `new MajoraClient({ baseUrl, token })`. `--url` and `--token-file` override them,
  and `MAJORA_GAME` is the fallback for `--game`.
- **Coverage.** It exposes the #1609 plain resources only, no more:
  - `games`: `list`, `mine`, `get`;
  - `npcs`, `factions`, `items`, `documents`: `list`, `get`, `create`, `update`;
  - `pcs`: `list`, `get`, `update`.

  Document pages (#1621), link routes (#1622) and photo uploads (#1623) are left out of #1610.
  Adding CLI commands for them is follow-up work.
- **No raw request escape hatch.** There is no `majora request <METHOD> <path>`: the library has
  no public raw-request API, and the CLI adds no logic of its own.

### Command grammar

- **`majora <resource> <action> [<id>] [flags]`.** For example:

  ```sh
  majora npcs list --game epic-quest
  majora npcs get 12 --game epic-quest --restricted
  majora games get epic-quest
  ```

- **Game-scoped resources take `--game <slug>`**, falling back to `MAJORA_GAME`. If neither is
  set, the command fails with a usage error.
- **Resource names follow the scope families** (`npcs`, `pcs`, ...), as the library does (see
  [Scopes](scopes.md)).
- **Help and version:** `majora --help`, `majora <resource> --help` and `majora --version`.
- **Rejected:** `majora game <slug> npcs list` (longer, and the slug sits in a position that is
  awkward to default from the environment).

### Output

- **stdout gets JSON only**, pretty-printed with 2 spaces.
- **`get`, `create` and `update`** print the returned object.
- **`list`** prints the page's `data` array. With `--meta` it prints
  `{ data, page, pages, perPage, total }` instead.
- **`list --all`** streams every item as NDJSON (one compact JSON object per line) through
  `iterate`, so memory stays bounded.
- **Rejected:** human-readable tables (`jq` covers that, and the CLI stays thin); a `--format`
  flag.

### Flags

| Flag | Meaning |
|---|---|
| `--url <url>` | Overrides `MAJORA_URL`. |
| `--token-file <path>` | Reads the token from a file (whitespace trimmed). Overrides `MAJORA_TOKEN`. |
| `--allow-insecure-http` | Passes `allowInsecureHttp: true`. |
| `--game <slug>` | The game for game-scoped resources (falls back to `MAJORA_GAME`). |
| `--restricted` | Uses the restricted variant (`all.json` / `full.json`). |
| `--page <n>`, `--per-page <n>` | One page of a `list`. |
| `--all` | Streams every page (NDJSON). Cannot be combined with `--page`. |
| `--meta` | `list` prints the page metadata together with `data`. |
| `--query <key>=<value>` | Repeatable. Builds the library's `query` filter object. |
| `--data <json \| @file \| ->` | The body for `create` / `update`: inline JSON, a file, or stdin (curl convention). It must be a JSON object. |
| `--timeout <ms>`, `--retries <n>` | Passed through to the library. |
| `--debug` | Prints stack traces on error. Never prints request headers. |
| `--help`, `--version` | Prints the help text or the package version. |

- **No `--token` flag.** A token on the command line ends up in shell history and in `ps`
  output. Use `MAJORA_TOKEN` or `--token-file`.

### Exit codes and error output

| Code | Cause |
|---|---|
| 0 | Success |
| 1 | Unexpected / internal error |
| 2 | Usage error: bad arguments, `UsageError`, `ConfigurationError`, invalid `--data` |
| 3 | `AuthenticationError` (401) |
| 4 | `PermissionError` (403) |
| 5 | `NotFoundError` (404) |
| 6 | `ValidationError` (400) |
| 7 | Other `ApiError` (409, 422, ...) |
| 8 | `ServerError` (5xx) |
| 9 | `NetworkError`, including timeouts |
| 130 | Interrupted (SIGINT) |

- **Errors go to stderr**: one line with the error's `message`. For a `ValidationError`, the
  `fields` object follows. Stack traces only with `--debug`.
- **The token is never printed.** Nothing the CLI prints (stdout, stderr, `--debug`, `--help`)
  ever includes it.

### Executable and argument parsing

- **The executable is `majora`** (`bin/majora.js`), as [Library](library.md#module-layout)
  already fixes.
- **Argument parsing uses Node's built-in `util.parseArgs`** in strict mode, with no dependency,
  so the package stays dependency-free like the library.
- **Rejected:** `commander` and `yargs` (a dependency for what `util.parseArgs` already does).

### Internal layout (`src/cli/`)

```text
src/cli/
  Cli.js              # run(argv) -> exit code; io (env, stdin, stdout, stderr) and fetch injected
  ArgumentParser.js   # util.parseArgs wrapper -> { resource, action, id, options }
  CommandRegistry.js  # resource -> allowed actions, game-scoped or not, library accessor
  BodyReader.js       # --data: inline / @file / stdin, must be a JSON object
  OutputWriter.js     # JSON, NDJSON, --meta
  ExitCodes.js        # error class -> exit code
  HelpText.js         # generated from CommandRegistry
```

- **One class per file, PascalCase**, like the rest of the library.
- **`bin/majora.js` is a shim.** It only does
  `process.exitCode = await new Cli({ ...process io }).run(process.argv.slice(2))`.

### Details settled by the implementation (#1610)

- **`--game` on `games`** is ignored, not an error: `games` is not game-scoped.
- **Integer flags.** `--page` and `--per-page` must be positive integers, `--timeout` and
  `--retries` non-negative integers; anything else exits 2.
- **`--query`** is split on its first `=`, so values may contain `=`; an entry without `=` or
  with an empty key exits 2.
- **`--data`** is required on `create` / `update` (exit 2 when missing). Error messages about
  the body never echo it, nor the file contents.
- **`--token-file`.** An unreadable or blank file exits 2; a blank file does not fall back to
  `MAJORA_TOKEN`. `--token` gets a hint pointing at `MAJORA_TOKEN` / `--token-file`.
- **`--help` and `--version`** print to stdout and exit 0; they skip the command checks.
- **Redaction.** As a last line of defence, the known token (`MAJORA_TOKEN` or the
  `--token-file` one) is replaced by `[REDACTED]` in anything written to stderr.

### Edge cases

- **Empty lists.** An empty list prints `[]`. `--all` on an empty list prints nothing.
- **Closed pipe.** `EPIPE` on stdout (for example `| head`) stops quietly and exits 0.
- **Interrupt.** SIGINT during `--all` aborts the in-flight request and exits 130.
- **Usage errors.** An unknown resource or action, an action the resource does not have
  (`pcs create`), a missing `<id>`, `--data` on a read, or `--all` with `--page` all exit 2 with
  a usage message.
- **Missing restricted variant.** `--restricted` on a family without that variant gets the
  library's `UsageError` and exits 2.
- **Bad body.** `--data` that is not valid JSON, or not an object, exits 2.

### Backward compatibility

- **New tool.** Nothing existing changes.
- **Public contract.** Once published, the command grammar, the flags, the exit codes and the
  JSON output are a public contract under the package's semver: changing any of them requires a
  major release.

### Testing strategy

- **Jasmine specs under `specs/cli/`**, mirroring `src/cli/`. They run `Cli.run` with an
  injected fetch stub (from `specs/support/`) and fake io streams, so no network and no globals
  are involved.
- **Coverage:** argument parsing per command, `--game` / `MAJORA_GAME`, `--token-file`, the three
  `--data` sources, JSON / NDJSON / `--meta` output, the exit code for every error class,
  `EPIPE`, and that no output on any path contains the token.
- **One smoke spec** spawns `bin/majora.js --version` and `--help` with `child_process`, which
  needs no network.

### Performance and security

- **Streaming.** `--all` streams through `iterate` (bounded memory, the library's per-page
  retries). The CLI never prefetches.
- **Token safety.** No `--token` flag, the token is never printed, and the library's HTTPS-only
  rule is relaxed only through `--allow-insecure-http`.

## Open questions

None remain: #1599 settled them all.

## Affected code

- `client/`: the CLI entry point and the `bin` field of `client/package.json`.
- `client/bin/majora.js`: the executable shim.
- `client/src/cli/`: the CLI classes (see [Internal layout](#internal-layout-srccli)).
- `client/specs/cli/`: the CLI specs.
- [Library](library.md): every command delegates to it.
