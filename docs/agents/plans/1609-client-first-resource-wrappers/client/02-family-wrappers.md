# Family wrappers

Add one file per scope family. Each file declares only its variant map (see the table in
[client.md](../client.md)) and its supported actions.

- `Games`: top-level and read-only. `list` (+ `iterate`) on `games` returns a `Page`. `mine()`
  on `my-games` returns the plain parsed body (an array). `get(slug)` on `games/<slug>` throws
  `UsageError` for an empty slug. It has no restricted variants.
- `Npcs` (character base): every action, with restricted `list` / `get` / `create` / `update`.
- `Pcs` (character base): `list`, `get` and `update`, but no `create`. Restricted variants
  exist for `get` and `update` only; `list({ restricted: true })` throws `UsageError`.
- `Factions`: `list`, `get`, `create` and `update`, with no restricted variant at all.
- `Items` and `Documents`: `list`, `get`, `create` and `update`, with restricted variants for
  `list` and `get` only.

Specs: for every family and action, check the exact URL (regular and restricted) and the HTTP
method. Every missing variant or action must raise `UsageError` with no request made.

## Files to Change

- `client/src/resources/Games.js`, `Npcs.js`, `Pcs.js`, `Factions.js`, `Items.js`,
  `Documents.js` — new wrappers.
- `client/specs/resources/<Family>_spec.js` — one spec per wrapper.
