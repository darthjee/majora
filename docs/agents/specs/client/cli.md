# CLI

The thin command-line tool shipped with the [library](library.md), for quick scripting and
debugging. Part of the [client spec](../client.md) (epic #1592). Refined by #1599 and
implemented by #1610.

## Overview

The CLI lets a user call the Majora API from a shell with a scoped token, for example
`majora characters list --game 3`. It adds no logic of its own: every command maps onto a
library call.

## Decisions

- **Thin layer.** The CLI is built on the library and only parses arguments, calls the library
  and prints the result.
- **Same package.** It ships in the same npm package as the library (see
  [Packaging](packaging.md)).
- **Configuration.** It reads `MAJORA_URL` and `MAJORA_TOKEN` from the environment, the same
  fallbacks as `new MajoraClient({ baseUrl, token })`.
- **Coverage.** It exposes the same resources as the library's first wrappers, no more.

## Open questions

Settled by #1599:

- The command grammar (`majora <resource> <action> [args]` or another shape).
- Output format: JSON by default, a human-readable table, or a flag to choose.
- Flags: how to override the URL and token, how to pass request bodies (inline JSON, a file,
  stdin), and how to page through results.
- Exit codes for API errors, authentication errors and usage errors.
- The executable name, and whether argument parsing uses a dependency or Node's built-in
  `util.parseArgs`.

## Affected code

- `client/`: the CLI entry point and the `bin` field of `client/package.json`.
- [Library](library.md): every command delegates to it.
