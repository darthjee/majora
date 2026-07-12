# Issue: Split `access.json` routes responsibilities

## Description

Several game-scoped resources expose an `.../access.json` endpoint:

- `/games/:game_slug/access.json`
- `/games/:game_slug/pcs/:character_id/access.json`
- `/games/:game_slug/npcs/:character_id/access.json`
- `/treasures/:treasure_id/access.json`

Each currently returns a single payload mixing two unrelated concerns — who the requesting user is, and what they're allowed to do with the specific resource:

```json
{
  "can_edit": true,

  "username": "<some_user_name>",
  "is_superuser": true,
  "is_staff": true,
  "is_dm": false,
  "is_player": true,
  "is_owner": false
}
```

`can_edit` is computed backend-side (via each model's `can_be_edited_by`, surfaced through the `*AccessSerializer` hierarchy in `source/games/serializers/`). Other page-level permission decisions are instead computed in the frontend, in `frontend/assets/js/utils/accessRouteConfig.js`, which maps each page/route to the resource(s) whose access must be checked — duplicating knowledge the backend already has about which roles can do what.

The frontend's `AccessStore` (`frontend/assets/js/utils/AccessStore.js`) is the central place components go through to read this access/permission state; it fetches per-resource `access.json` on route change or auth change and caches results in memory.

## Problems

- The `.../access.json` endpoints mix two unrelated responsibilities: reporting who the user is (identity/roles) and reporting what the user may do (permissions on a specific resource).
- Permission rules are split across two layers instead of having one source of truth: some (`can_edit`) are computed and returned by the backend, while others (the page → required-role mapping) live only in the frontend's `accessRouteConfig.js` — even though the backend independently re-enforces the same rules via `source/games/permissions.py`.
- Because the payload is user-identity-specific, every `access.json` response is forced to skip caching (`X-Skip-Cache: true`, enforced both by the backend's `access_response` helper and, redundantly, by the frontend's `skipCacheSuffixes.js`), even for the parts of the payload (like role-based permissions) that could otherwise be cached.

## Solution

### Split each `.../access.json` into two endpoints

For each existing `.../access.json` endpoint (game, pc, npc, treasure), introduce a matching `.../permissions.json` endpoint.

#### `.../access.json` (identity/roles only)

Returns only who the user is:

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

#### `.../permissions.json` (permissions only)

Returns only booleans describing what the user may do:

```json
{
  "can_edit": true
}
```

All permission values must be booleans.

##### Requesting without a `role` query parameter

Permissions are computed from the requesting user's own token/session, exactly like `access.json` does today. Because this is user-specific, the response must include `X-Skip-Cache: true` — regardless of whether the request itself carried a skip-cache hint.

##### Requesting with a `role` query parameter

If a `role` query parameter is sent (as a single string or an array, e.g. `?role=dm` or `?role=dm&role=player`), permissions are computed for those role(s) instead of the requester's actual identity. Valid role values are `dm`, `player`, `owner`, `superuser`, and `staff`, mirroring `is_dm`/`is_player`/`is_owner`/`is_superuser`/`is_staff`. When more than one role is given, permissions are computed as if the user held all of them at once. Because this is not user-specific, the response is cacheable: the frontend must not send `x-skip-cache` and the backend must not return `X-Skip-Cache` for these requests.

The frontend's `skipCacheSuffixes.js` (which today unconditionally forces skip-cache on any `*/access.json` request) must be updated so that `*/permissions.json` requests are only forced to skip cache when no `role` param is present.

### `AccessStore` keeps owning both request types

`AccessStore` remains the single place components go through for both `.../access.json` and `.../permissions.json` — any code that needs `access` must also request `permissions`.

`AccessStore` keeps an internal cache keyed by the set of roles requested for a given page, mapping that set to its resulting permissions. Changing page, logging in, or logging out clears this cache (same invalidation points as today: `syncForRoute`, `syncForAuthChange`).

This cache lays the groundwork for a future feature (out of scope here) letting an admin preview how a page looks under a different role.

### Move the frontend's page → permission mapping into the backend

`frontend/assets/js/utils/accessRouteConfig.js` currently encodes, per page, which resource(s) need an access/permission check. This mapping should move to the backend, so there is a single source of truth for "who can do what," and so the backend has one place to check these same permissions for its own internal enforcement (today duplicated across model methods like `can_be_edited_by` and the `*AccessSerializer` classes, plus the separate enforcement-only `source/games/permissions.py` classes).

### Extend the shared permissions class to sessions and tasks too

Game sessions and tasks currently compute their own `can_edit` inline in their detail serializers (`game_session_detail.py`, and by extension `task`), duplicating the same `can_be_edited_by`-based logic used elsewhere. These should be migrated to use the same shared backend permissions class introduced by this issue, even though sessions and tasks don't have their own dedicated `access.json`/`permissions.json` endpoints today.

## Benefits

- Single source of truth for permission rules: one backend class computes them, reused both for reporting (`permissions.json`) and internal enforcement.
- Role-based (non-user-specific) permission lookups become cacheable, reducing redundant requests for information that doesn't vary per request.
- Removes duplicated page → permission-check knowledge between `accessRouteConfig.js` (frontend) and the backend's own enforcement rules.
- Sets up the cache shape `AccessStore` needs to later support previewing a page as a different role.
