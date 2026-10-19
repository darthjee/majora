# Argument parsing and command registry

Add the two classes that turn `argv` into a validated command, before any client is built.

**`CommandRegistry`** declares, per resource, the allowed actions, whether it is game-scoped
and how to reach the library wrapper:

- `games`: `list`, `mine`, `get`; top-level (`client => client.games`);
- `npcs`, `factions`, `items`, `documents`: `list`, `get`, `create`, `update`; game-scoped
  (`(client, slug) => client.game(slug).<family>`);
- `pcs`: `list`, `get`, `update`; game-scoped.

It also records which actions need an `<id>` (`get`, `update`) and which take a body
(`create`, `update`). It is the single source for `HelpText` (step 03).

**`ArgumentParser`** wraps `util.parseArgs` in strict mode with `allowPositionals: true` and
the flags from the spec: `--url`, `--token-file`, `--allow-insecure-http`, `--game`,
`--restricted`, `--page`, `--per-page`, `--all`, `--meta`, `--query` (`multiple: true`),
`--data`, `--timeout`, `--retries`, `--debug`, `--help`, `--version`. There is no `--token`.
It returns `{ resource, action, id, options }` and throws a CLI usage error (a local error
class or `UsageError`, mapped to exit 2) for:

- an unknown flag (strict `parseArgs` error), unknown resource or action, an action the resource
  lacks (`pcs create`), a missing `<id>` for `get` / `update`, extra positionals;
- `--data` on a read (`list`, `mine`, `get`), a missing `--data` on `create` / `update`;
- `--all` with `--page`;
- non-integer `--page`, `--per-page`, `--timeout`, `--retries`;
- a `--query` without `=` (split on the first `=`, so values may contain `=`).

`--game` falls back to `env.MAJORA_GAME`; a game-scoped command with neither is a usage error.
`--help` / `--version` short-circuit validation (handled by `Cli`).

## Files to Change

- `client/src/cli/ArgumentParser.js` — new.
- `client/src/cli/CommandRegistry.js` — new.
- `client/specs/cli/ArgumentParser_spec.js` — new: parsing per command, every usage error
  above, `--game` / `MAJORA_GAME`, repeatable `--query`.
- `client/specs/cli/CommandRegistry_spec.js` — new: actions per resource, game-scoped lookup
  through a `MajoraClient` built with `FetchStub`.
