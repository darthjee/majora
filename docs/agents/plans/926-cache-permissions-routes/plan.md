# Plan: Cache permissions routes

Issue: [926-cache-permissions-routes.md](../../issues/926-cache-permissions-routes.md)

## Overview

Replace the four entity-nested `permissions.json` routes (game, treasure, PC, NPC) with
entity-agnostic ones under a new `/permissions/` prefix, since their response only ever depends
on entity type + the `?role=` query params (confirmed: the real `game`/`character` object passed
into `PermissionsBuilder` is never read once a `roles` override is supplied — see
`backend/games/permissions/base.py`'s `BasePermission.__init__`). This collapses what is
currently one HTTP-cache entry per entity instance into one entry per (entity type, role
combination), drops the internal-only `X-Force-Public-Cache` header in favor of a path-prefix
based decision in `CacheControlMiddleware`, updates the frontend to call the new routes without
ever sending `X-Skip-Cache` on them, and warms the new routes in the Navi cache-warmer config.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)
- [cache](cache.md)

## Shared contracts

**New routes (all `GET`, all `AllowAny`, no path parameters beyond the fixed segment):**

| New route | Replaces |
|---|---|
| `/permissions/game.json` | `games/<slug:game_slug>/permissions.json` |
| `/permissions/treasure.json` | `treasures/<int:treasure_id>/permissions.json` |
| `/permissions/game_pc.json` | `games/<slug:game_slug>/pcs/<int:character_id>/permissions.json` |
| `/permissions/game_npc.json` | `games/<slug:game_slug>/npcs/<int:character_id>/permissions.json` |

The old 4 routes are removed outright (not kept alongside the new ones). Response body shape is
byte-for-byte unchanged from today's per-entity endpoints — only the URL and the removal of the
entity-id path segment change; the frontend's response-parsing code does not change.

**Role query vocabulary** (unchanged): repeated `?role=` params, recognized values `superuser`,
`staff`, `dm`, `player`, `owner`, `logged` (see `backend/games/views/common.py`'s
`parse_role_booleans`), any subset/count, unrecognized values tolerated with no 400.

**Cache-Control:** the new `/permissions/` routes must always resolve to the public/anonymous
`Cache-Control` tier, regardless of the caller's own auth state, without any view setting
`X-Force-Public-Cache` (backend deletes that mechanism for these routes and instead has
`CacheControlMiddleware` recognize the `/permissions/` path prefix directly). Nothing on these
routes may ever set `X-Skip-Cache` either — backend response side (already true) or frontend
request side (needs an update, see below).

**Cache-warmer role combinations** — one set per new route, role params ordered per the
frontend's own canonical order, `AccessStoreRoles.ROLE_FLAGS`
(`frontend/assets/js/utils/access/store/AccessStoreRoles.js`): `superuser`, `staff`, `dm`,
`player`, `owner`, `logged` (filtered to the roles present in that combination):

1. no roles
2. `?role=player&role=logged`
3. `?role=dm&role=player&role=logged`
4. `?role=staff&role=player&role=logged`
5. `?role=staff&role=dm&role=player&role=logged`
