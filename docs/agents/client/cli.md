# Client CLI

Design and internals of the `majora` command shipped with the [client library](library.md).
The user-facing reference (commands, flags, examples) is in
[`client/README.md`](../../../client/README.md#cli).

## Principles

- **Thin layer.** Every command maps onto one library call; the CLI only parses arguments,
  calls the library and prints the result.
- **Same package.** It ships in `majora-client` as the `majora` executable (`bin/majora.js`).
- **No dependency.** Argument parsing uses Node's built-in `util.parseArgs` in strict mode.
- **Public contract.** The command grammar, the flags, the exit codes and the JSON output are
  part of the package's semver: changing any of them needs a major release.

## Command grammar

`majora <resource> <action> [<id>] [flags]`, for example:

```sh
majora npcs list --game epic-quest
majora npcs get 12 --game epic-quest --restricted
majora games get epic-quest
```

| Resource | Actions | Game-scoped |
|---|---|---|
| `games` | `list`, `mine`, `get` | no |
| `npcs`, `factions`, `items`, `documents` | `list`, `get`, `create`, `update` | yes |
| `pcs` | `list`, `get`, `update` | yes |

- Game-scoped resources take `--game <slug>`, falling back to `MAJORA_GAME` (an empty `--game`
  also falls back). Without either, the command exits 2. `--game` on `games` is ignored.
- `get` and `update` take an `<id>` (a slug for `games get`); `create` and `update` need
  `--data`.
- Document pages, link routes and photo uploads are not exposed yet (see
  [library.md](library.md#not-yet-wrapped)).
- There is no raw `majora request <METHOD> <path>` command.

## Configuration and flags

- `MAJORA_URL` and `MAJORA_TOKEN` are read from the environment, the same fallbacks as the
  library. `--url` and `--token-file` override them.
- **There is no `--token` flag**: a token on the command line ends up in shell history and in
  `ps` output. Passing `--token` exits 2 with a hint pointing at `MAJORA_TOKEN` /
  `--token-file`.
- `--token-file` is read and trimmed; an unreadable or blank file exits 2 and never falls back
  to `MAJORA_TOKEN`.
- `--allow-insecure-http` passes `allowInsecureHttp: true`; it is the only way to relax the
  library's HTTPS-only rule.
- `--timeout` and `--retries` go to the `MajoraClient` constructor.
- `--page` / `--per-page` must be positive integers, `--timeout` / `--retries` non-negative
  integers. `--query key=value` is repeatable and split on the first `=`. `--all` cannot be
  combined with `--page`.
- `--data` takes inline JSON, `@file` or `-` (stdin). It must be a JSON object, and error
  messages never echo the body or the file contents.
- `--help` and `--version` print to stdout and exit 0; strict parsing still applies, so an
  unknown flag or resource still exits 2.

## Output

- **stdout gets JSON only**, pretty-printed with 2 spaces.
- `get`, `create`, `update` and `games mine` print the returned value.
- `list` prints the page's `data` array; with `--meta` it prints
  `{ data, page, pages, perPage, total }`.
- `list --all` streams every item as NDJSON through `iterate`, so memory stays bounded. An
  empty list prints `[]`; `--all` on an empty list prints nothing.
- Writes respect stream back-pressure. A closed pipe (`EPIPE`, `ERR_STREAM_DESTROYED`, for
  example `| head`) stops quietly with exit 0.
- No human-readable tables and no `--format` flag: `jq` covers that.

## Exit codes and error output

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

- Errors go to stderr: one line with the error's `message`, then the compact `fields` JSON for a
  `ValidationError`, then the stack trace only with `--debug`.
- **The token is never printed.** As a last line of defence, the known token (`MAJORA_TOKEN` or
  the `--token-file` one) is replaced by `[REDACTED]` in anything written to stderr.

## Internal layout (`src/cli/`)

```text
src/cli/
  Cli.js              # run(argv) -> exit code; env, stdin, stdout, stderr, fetch and readFile injected
  ArgumentParser.js   # util.parseArgs wrapper -> { resource, action, id, options }
  CommandRegistry.js  # resource -> actions, game-scoped or not, library accessor
  BodyReader.js       # --data: inline / @file / stdin, must be a JSON object
  OutputWriter.js     # JSON, NDJSON, --meta, back-pressure
  ExitCodes.js        # error class -> exit code
  HelpText.js         # global and per-resource help, generated from CommandRegistry
```

- `bin/majora.js` builds a `Cli` with the process io, registers `SIGINT` to call `cli.abort()`
  and sets `process.exitCode` to the result of `cli.run(process.argv.slice(2))`.
- `Cli` keeps an `AbortController` whose signal is passed to every library call, so `SIGINT`
  aborts any in-flight request (and stops `--all` between items) and the run exits 130.

## Testing

- Jasmine specs under `specs/cli/` run `Cli.run` with a fetch stub and fake streams
  (`specs/support/buildCli.js`, `FakeStreams.js`): no network and no globals.
- They cover parsing per command, `--game` / `MAJORA_GAME`, `--token-file`, the three `--data`
  sources, JSON / NDJSON / `--meta`, the exit code for every error class, `EPIPE`, and that no
  output on any path contains the token.
- `bin_spec.js` spawns `bin/majora.js` (`--version`, `--help` and usage errors) with
  `child_process`, without network.
