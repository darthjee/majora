# Exit codes, help text and the Cli runner

**`ExitCodes`** maps an error to its code, most specific class first: `UsageError`,
`ConfigurationError` and CLI usage / bad-body errors → 2; `AuthenticationError` → 3;
`PermissionError` → 4; `NotFoundError` → 5; `ValidationError` → 6; `ServerError` → 8; other
`ApiError` → 7; `NetworkError` → 9; anything else → 1. Also exports `SUCCESS = 0` and
`INTERRUPTED = 130`.

**`HelpText`** generates `majora --help` (grammar, resources, global flags, env variables
`MAJORA_URL` / `MAJORA_TOKEN` / `MAJORA_GAME`, exit codes) and `majora <resource> --help`
(that resource's actions and whether it needs `--game`) from `CommandRegistry`. It never
includes the token or any env value.

**`Cli`** — `new Cli({ env, stdin, stdout, stderr, fetch, fs, signal })`,
`async run(argv) → exit code`:

1. Parse with `ArgumentParser`; handle `--help` / `--version` (version read from
   `client/package.json`) and return 0.
2. Resolve the token: `--token-file` (read, whitespace trimmed) overrides `env.MAJORA_TOKEN`;
   `--url` overrides `env.MAJORA_URL`. Build `new MajoraClient({ baseUrl, token, timeout,
   retries, fetch, allowInsecureHttp, env })`.
3. Resolve the wrapper through `CommandRegistry` and call the action with `restricted`,
   `page`, `perPage`, `query`, `signal`; `create` / `update` read the body via `BodyReader`.
4. Print through `OutputWriter`; `list --all` streams `iterate(...)`.
5. On error: write one line with `error.message` to stderr, then `JSON.stringify(fields)` for a
   `ValidationError`, plus `error.stack` only with `--debug`; return `ExitCodes.for(error)`.
6. SIGINT: `Cli` owns an `AbortController` combined with the injected `signal`; when it aborts
   during a request or `--all`, return 130 (not 9). `EPIPE` returns 0 silently.

Before writing anything to stderr, defensively redact the resolved token from the message
(replace with `[REDACTED]`), so no path can leak it.

## Files to Change

- `client/src/cli/ExitCodes.js` — new.
- `client/src/cli/HelpText.js` — new.
- `client/src/cli/Cli.js` — new.
- `client/specs/cli/ExitCodes_spec.js` — new: every error class → code.
- `client/specs/cli/HelpText_spec.js` — new.
- `client/specs/cli/Cli_spec.js` — new, with `FetchStub` and fake streams: one happy path per
  command, the URLs hit (`restricted`, `page`, `per_page`, `query`), `--token-file`,
  `MAJORA_GAME`, `--meta`, `--all` across several pages, every exit code (401, 403, 404, 400
  with `fields`, 409, 500, network failure, timeout, config error, `--restricted` without a
  variant), `--debug` stack traces, abort → 130, `EPIPE` → 0, and a token-leak assertion over
  stdout + stderr on every path (including `--debug` and `--help`).
