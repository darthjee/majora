# Documentation

Document the CLI for users and keep the agent docs in sync.

- `client/README.md`: add a **CLI** section: install (`npx majora-client` / global install,
  executable `majora`), configuration (`MAJORA_URL`, `MAJORA_TOKEN`, `MAJORA_GAME`, `--url`,
  `--token-file`, why there is no `--token`), command grammar and the resource/action table,
  flags, output (JSON, `--meta`, NDJSON with `--all`, piping into `jq`), and the exit-code
  table. Mirror the spec; do not invent behaviour.
- `docs/agents/specs/client/cli.md`: only touch it if the implementation had to settle a
  detail the spec leaves open (e.g. `--game` ignored on `games`), recording it under
  Decisions.

## Files to Change

- `client/README.md` — CLI section.
- `docs/agents/specs/client/cli.md` — only if a detail had to be settled.
