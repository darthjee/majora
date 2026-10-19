# Issue: Client: first resource wrappers

## Description

Part of epic #1592 (Majora client for automations, with fine-grained API tokens). The epic records the agreed design: scope, permission model, token lifecycle, client shape and token management permissions.

Add the first plain resource wrappers to the client library, on top of the core delivered by #1608, as settled in `docs/agents/specs/client/library.md` (sections *Module layout* and *Resource wrappers*, settled by #1598).

## Problem

The client core (`HttpClient`, `Paginator`, `Page`, errors) exists, but callers can only make raw `client.http` requests. There is no typed, scope-aligned API for the resources automations need first.

## Expected Behavior

```js
await client.games.list();               // games.json
await client.games.mine();               // my-games.json
await client.games.get('epic-quest');      // games/epic-quest.json

const game = client.game('epic-quest');
await game.npcs.list({ page: 2 });
await game.npcs.get(12, { restricted: true });          // npcs/12/full.json
await game.npcs.create({ name: 'Bob' });
await game.npcs.update(12, data, { restricted: true }); // PATCH npcs/12/full.json
await game.pcs.list({ restricted: true });              // throws UsageError, no request
```

- `games` (read-only, top-level): `list` (+ `iterate`), `mine`, `get(slug)`. `list` returns a `Page`, because `games.json` is paginated. `mine` returns the plain parsed array, because `my-games.json` is not paginated.
- `npcs`, `factions`, `items`, `documents`: `list` (+ `iterate`), `get`, `create`, `update`.
- `pcs`: `list` (+ `iterate`), `get`, `update` (the API has no PC create route).
- No `delete` on any of them (none of these endpoints accept `DELETE`).
- `update` sends `PATCH`. Return values are plain parsed JSON; `list` returns a `Page`.
- The default is the regular variant. `{ restricted: true }` selects the restricted URL from the variant map below. Asking for a missing variant throws `UsageError` before any request, with no automatic fallback (for example on 403).

| Family | `list` | `get` | `create` | `update` |
|---|---|---|---|---|
| `npcs` | `npcs/all.json` | `npcs/<id>/full.json` | `POST npcs/full.json` | `PATCH npcs/<id>/full.json` |
| `pcs` | — | `pcs/<id>/full.json` | — (no create at all) | `PATCH pcs/<id>/full.json` |
| `factions` | — | — | — | — |
| `items` | `items/all.json` | `items/<id>/full.json` | — | — |
| `documents` | `documents/all.json` | `documents/<id>/full.json` | — | — |

(Checked against `backend/games/urls/` on 2026-10-19.)

## Solution

- `client/src/resources/Resource.js`: base wrapper built on `HttpClient` / `Paginator`, holding the per-family variant map (action → regular URL, restricted URL or none), so adding a variant later is a one-line change.
- `client/src/resources/GameResource.js`: base for game-scoped families (`games/<slug>/<family>`).
- A shared character base for `Npcs.js` and `Pcs.js` (their routes are parallel, built by `backend/games/urls/_character_routes.py`).
- One file per scope family: `Games.js`, `Npcs.js`, `Pcs.js`, `Factions.js`, `Items.js`, `Documents.js`.
- Wire `client.games` and `client.game(slug)` into `MajoraClient.js`. `src/index.js` stays limited to `MajoraClient` and the error classes.
- Document each wrapper in JSDoc and in `client/README.md`.
- Jasmine specs under `client/specs/resources/`, using an injected `fetch` stub from `specs/support/`. They cover URL building per action and variant, HTTP methods and bodies, `UsageError` for missing variants (with no request made), and `list` / `iterate` pagination.
- Out of scope, split into their own issues: document pages (#1621), link routes (#1622), photo uploads (#1623).
- Owning agent: `client`.

### Acceptance criteria

Every plain resource listed in the spec has a tested wrapper, with its regular and restricted variants, and lint passes.

## Benefits

Automations get a small, scope-aligned API for the first resource set. It is the base the extras (#1621–#1623) and the CLI will build on.
