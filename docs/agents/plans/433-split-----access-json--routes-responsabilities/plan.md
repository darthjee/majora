# Plan: Split `access.json` routes responsibilities

Issue: [433-split-----access-json--routes-responsabilities.md](../issues/433-split-----access-json--routes-responsabilities.md)

## Overview

Split the identity-reporting and permission-reporting responsibilities currently mixed
into each `.../access.json` endpoint (game, pc, npc, treasure). `access.json` keeps
returning only identity/role fields (`username`, `is_superuser`, `is_staff`, `is_dm`,
`is_player`, `is_owner`); a new sibling `.../permissions.json` returns only `can_edit`.
`permissions.json` gains an optional `role` query parameter (single value or array) that
computes `can_edit` for a *simulated* role instead of the requester's real identity — this
variant is cacheable, unlike the always-skip-cache identity-based default. The backend
gains a shared, resource-parameterized permission-computation used both by the new
`permissions.json` views and (where applicable) existing detail serializers that currently
duplicate `can_edit` inline (`CharacterDetailSerializer`, `GameSessionDetailSerializer`).
The frontend's `AccessStore` is extended to fetch and cache both request types, and its
`accessRouteConfig.js` page→resource mapping moves to the backend.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)

## Product-owner review findings (already folded into the contracts below)

- `owner` is not a role peer to `dm`/`player`/`superuser`/`staff` — it's a per-resource
  ownership fact that only exists for PC characters. Simulating `role=owner` against a
  Game, Treasure, NPC, GameSession, or Task must be a harmless no-op (never flips
  `can_edit` to `true`), not a fabricated grant.
- `is_player` must never affect `can_edit` for any resource, in either the real-identity
  or role-simulated path. The narrow player-facing NPC capabilities (`public_slain`
  toggle, NPC photo upload — issues #416/#429) are separate, already-narrower
  authorizations (`NpcPlayerEditPermission`), not general editing rights, and are out of
  scope for `permissions.json`'s `can_edit`.
- Treasure's `can_edit` is a dual path (global superuser-only, OR that game's GameMaster
  when the treasure is game-exclusive) — this must be preserved exactly, not flattened to
  a single delegate call.
- `GameSession`/`Task` have no owner or player branch at all — both delegate `can_edit`
  entirely to their `Game`'s rule (superuser OR that game's GameMaster).
- The `accessRouteConfig.js` relocation is rule-preserving (a routing table, not a rule
  engine) — the main risk is losing the `superuser`-only / `staffOrSuperuser` special
  cases (global Treasure routes, Staff management pages) in translation.

## Shared contracts

### New/changed endpoints

| Method | URL | Notes |
|---|---|---|
| GET | `/games/<slug>/permissions.json` | new, sibling to existing `access.json` |
| GET | `/games/<slug>/pcs/<id>/permissions.json` | new |
| GET | `/games/<slug>/npcs/<id>/permissions.json` | new |
| GET | `/treasures/<id>/permissions.json` | new |
| GET | `/games/<slug>/access.json` | existing, response shrinks (drops `can_edit`) |
| GET | `/games/<slug>/pcs/<id>/access.json` | existing, response shrinks |
| GET | `/games/<slug>/npcs/<id>/access.json` | existing, response shrinks |
| GET | `/treasures/<id>/access.json` | existing, response shrinks |

All four are `AllowAny`, mirroring the existing `access.json` routes.

### Response shapes

`access.json` (unchanged fields, `can_edit` removed):

```json
{
  "username": "<some_user_name>",
  "is_superuser": true,
  "is_staff": true,
  "is_dm": false,
  "is_player": true,
  "is_owner": false
}
```

`permissions.json`:

```json
{ "can_edit": true }
```

### `role` query parameter

- Accepted as a single value (`?role=dm`) or repeated (`?role=dm&role=player`).
- Recognized values: `dm`, `player`, `owner`, `superuser`, `staff`. Unrecognized values
  are silently ignored (same tolerant convention already used by `?allegiance=`/`?slain=`
  filters elsewhere in this codebase) — no 400 for a typo'd role.
- When one or more recognized roles are given, `can_edit` is computed as if the requester
  held all of them simultaneously, **ignoring the requester's real identity entirely**.
  Per the product-owner findings above: `player` and `staff` never affect `can_edit` for
  any of these four resources (documented no-ops); `owner` only affects `can_edit` for
  PC characters (no-op for NPCs, games, treasures, sessions, tasks); `dm` and `superuser`
  are the two roles that actually flip `can_edit` (plus `owner` for PCs, and the
  game-exclusive-treasure case where `dm` matters through the owning game).
- When no `role` param is given, `can_edit` is computed from the requester's actual
  identity/token, exactly like today's `access.json`'s `can_edit` did.

### Cache-header contract

- `access.json` keeps setting `X-Skip-Cache: true` unconditionally (unchanged).
- `permissions.json` without a `role` param sets `X-Skip-Cache: true` (user-specific,
  same as today).
- `permissions.json` **with** a `role` param must not set `X-Skip-Cache`, and the
  response must be publicly cacheable (not vary by the actual requester's own auth
  state) — see backend.md Step 4 for how this interacts with `CacheControlMiddleware`.
- Frontend: `skipCacheSuffixes.js` must only force skip-cache on `*/permissions.json`
  when the outgoing request has no `role` param — see frontend.md.

### `AccessStore` (frontend) responsibilities

- Keeps owning both `.../access.json` and `.../permissions.json` fetches; any code that
  needs `access` also implicitly requests `permissions` for the same resource.
- Keeps an internal cache keyed by the resource + the set of roles requested, so repeated
  role-based permission lookups for the same page don't refetch.
- Cache is cleared on route change and on login/logout (`syncForRoute`,
  `syncForAuthChange`, unchanged invalidation points).

### `accessRouteConfig.js` relocation

Per the product-owner review, the URL-pattern/param-extraction part of this file is
frontend routing knowledge that cannot move (it mirrors `HashRouteResolver`'s own
patterns). What actually moves to the backend is the **resource-kind mapping** (which
resource type — game/pc/npc/treasure/superuser/staffOrSuperuser — a given page needs
checked), served as a small config the frontend fetches once and caches, replacing the
hardcoded `kind` values in the current file. See frontend.md and backend.md for the
concrete split.

## Notes

- Three new public read endpoints are added and existing `access.json` response shapes
  change — flag this for `data-access` review once implemented (serializer field
  changes, permission logic changes).
- The new `role` query parameter simulates identity for authorization reporting — flag
  this for `security` review once implemented, specifically to confirm it cannot be used
  to infer anything beyond the documented `can_edit` boolean, and that it never touches
  write paths (report-only, `permissions.json` stays `GET`).
- `docs/agents/access-control.md` must be updated in the same PR (per its own header
  instruction) to reflect the split, the new endpoints, and the `role` parameter's
  documented no-ops.
