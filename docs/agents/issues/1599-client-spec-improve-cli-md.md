# Issue: Client spec: improve cli.md

## Description

Part of epic #1592 (Majora client for automations, with fine-grained API tokens). Review
`docs/agents/specs/client/cli.md`, the spec page for the thin CLI shipped with the `client/`
library, and settle its open questions before #1610 (CLI) implements it.

## Problem

`cli.md` lists five open questions: the command grammar, the output format, the flags (URL and
token override, request bodies, paging), the exit codes, and the executable name and argument
parser. #1598 also left two hand-offs: the `--game 3` example must use a game slug, and the
CLI's resources must follow the scope families (`npcs`, `pcs`, ...). `library.md` leaves the
internal layout of `src/cli/` to this issue as well. Until these are settled, #1610 cannot start.

## Expected Behavior

- `docs/agents/specs/client/cli.md` records every decision below under **Decisions** (with the
  rejected alternatives), and its **Open questions** section reads "None remain: #1599 settled
  them all."
- The `--game 3` example is replaced with a slug-based one.
- `library.md`'s module-layout note "internal layout settled by #1599" points at the settled
  layout, and its hand-off note to #1599 is marked resolved.
- The hub `docs/agents/specs/client.md` CLI aspect entry mentions that #1599 settled the grammar,
  output, flags and exit codes.
- Documentation only: no code changes.

## Solution

Fold the agreed design below into `cli.md`, keeping the page template (Overview, Decisions,
Open questions, Affected code).

### Scope

- The CLI covers the #1609 plain resources only: `games` (`list`, `mine`, `get`), `npcs`,
  `factions`, `items`, `documents` (`list`, `get`, `create`, `update`) and `pcs` (`list`, `get`,
  `update`).
- Document pages (#1621), link routes (#1622) and photo uploads (#1623) are left out of #1610.
  Adding CLI commands for them is follow-up work.
- No raw `majora request <METHOD> <path>` escape hatch. The library has no public raw-request
  API, and the CLI adds no logic of its own.

### Command grammar

- `majora <resource> <action> [<id>] [flags]`. Examples: `majora npcs list --game epic-quest`,
  `majora npcs get 12 --game epic-quest --restricted`, `majora games get epic-quest`.
- Game-scoped resources take `--game <slug>`, falling back to `MAJORA_GAME`. If neither is set,
  the command fails with a usage error.
- Resource names follow the scope families (`npcs`, `pcs`, ...), as the library does.
- Also `majora --help`, `majora <resource> --help` and `majora --version`.
- Rejected: `majora game <slug> npcs list`. It is longer, and the slug sits in a position that is
  awkward to default from the environment.

### Output

- stdout gets JSON only, pretty-printed with 2 spaces.
- `get`, `create` and `update` print the returned object.
- `list` prints the page's `data` array. With `--meta` it prints
  `{ data, page, pages, perPage, total }` instead.
- `list --all` streams every item as NDJSON (one compact JSON object per line) through
  `iterate`, so memory stays bounded.
- Rejected: human-readable tables, since `jq` covers that and the CLI stays thin. Also rejected: a
  `--format` flag.

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
| `--help`, `--version` | |

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

- Errors go to stderr: one line with the error's `message`. For a `ValidationError`, the `fields`
  object follows. Stack traces only with `--debug`.
- Nothing the CLI prints (stdout, stderr, `--debug`, `--help`) ever includes the token.

### Executable and argument parsing

- The executable is `majora` (`bin/majora.js`), as `library.md` already fixes.
- Argument parsing uses Node's built-in `util.parseArgs` in strict mode, with no dependency, so
  the package stays dependency-free like the library. Rejected: `commander` and `yargs`.

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

`bin/majora.js` only does `process.exitCode = await new Cli({ ...process io }).run(process.argv.slice(2))`.

### Edge cases

- An empty list prints `[]`. `--all` on an empty list prints nothing.
- `EPIPE` on stdout (for example `| head`) stops quietly and exits 0.
- SIGINT during `--all` aborts the in-flight request and exits 130.
- An unknown resource or action, an action the resource does not have (`pcs create`), a missing
  `<id>`, `--data` on a read, or `--all` with `--page` all exit 2 with a usage message.
- `--restricted` on a family without that variant gets the library's `UsageError` and exits 2.
- `--data` that is not valid JSON, or not an object, exits 2.

### Backward compatibility

This is a new tool, so nothing existing changes. Once it is published, the command grammar, the
flags, the exit codes and the JSON output are a public contract under the package's semver:
changing any of them requires a major release.

### Testing strategy

- Jasmine specs under `specs/cli/`, mirroring `src/cli/`. They run `Cli.run` with an injected
  fetch stub (from `specs/support/`) and fake io streams, so no network and no globals are
  involved.
- What the specs cover: argument parsing per command, `--game` / `MAJORA_GAME`, `--token-file`,
  the three `--data` sources, JSON / NDJSON / `--meta` output, the exit code for every error
  class, `EPIPE`, and that no output on any path contains the token.
- One smoke spec spawns `bin/majora.js --version` and `--help` with `child_process`, which needs
  no network.

### Performance and security

- `--all` streams through `iterate` (bounded memory, the library's per-page retries). The CLI
  never prefetches.
- Token safety: no `--token` flag, the token is never printed, and the library's HTTPS-only rule
  is reached only through `--allow-insecure-http`.

## Benefits

#1610 gets a complete, unambiguous contract: the command grammar, the flags, the output and the
exit codes. Scripts written against the published CLI get a stable interface under semver, and
token-safety rules are fixed before any code exists.
