# Frontend Plan: Split `access.json` routes responsibilities

Main plan: [plan.md](plan.md)

## Shared contracts

See [plan.md](plan.md)'s "Shared contracts" section for the full endpoint list, response
shapes, and cache-header contract. Summary of what this side must consume/produce:

- `GameClient`/`CharacterClient`/`TreasureClient` gain `fetchXPermissions(...)` methods
  hitting the new `.../permissions.json` routes, optionally passing `role`.
- `access.json` responses no longer include `can_edit` — any code reading `can_edit` off
  an access-fetch result must switch to the new permissions fetch instead.
- `skipCacheSuffixes.js` must only force skip-cache on `*/permissions.json` requests that
  have no `role` param (role-based requests must be cacheable).
- `accessRouteConfig.js`'s hardcoded `kind` values are replaced by data fetched from the
  backend's new resource-kind config endpoint (see backend.md Step 6); the URL
  pattern/param-extraction part of the file stays frontend-owned.

## Step 1 — Add `fetchXPermissions` to the resource clients

In `frontend/assets/js/client/GameClient.js`, `CharacterClient.js`, `TreasureClient.js`,
add `fetchGamePermissions`/`fetchCharacterPermissions`/`fetchTreasurePermissions`
mirroring the existing `fetchGameAccess`/`fetchCharacterAccess`/`fetchTreasureAccess`
methods exactly (same signature shape: id/slug params, token, signal), just pointing at
`.../permissions.json` and accepting an optional `roles` array that gets serialized as
repeated `role=` query params (`?role=dm&role=player`).

## Step 2 — Update `AccessStore`

`frontend/assets/js/utils/AccessStore.js`:

- `ensureGameAccess`/`ensureCharacterAccess`/`ensureTreasureAccess` keep their existing
  signatures and cache keys, but their `RESOURCE_DEFAULT` (`{ can_edit: false }`) and
  parsed payload shape change: `can_edit` is no longer part of the `access.json` result.
  These become identity-only reads (`username`, `is_superuser`, `is_staff`, `is_dm`,
  `is_player`, `is_owner`), with a fail-closed default of all-`null`/`false` matching
  today's anonymous shape.
- Add `ensureGamePermissions(gameSlug, roles)`, `ensureCharacterPermissions(kind,
  gameSlug, characterId, roles)`, `ensureTreasurePermissions(id, roles)` — same
  ensure/cache/abort pattern as the existing `ensure*` methods, but keyed by resource
  **and** the (sorted, deduplicated) role set, e.g.
  `permissions:game:<slug>:<roles-joined>` — so two different role combinations for the
  same page/resource don't collide in the cache, matching the issue's "internal cache
  with pairs where the array of roles for a specific page produce a set of permissions."
  `RESOURCE_DEFAULT` for these is `{ can_edit: false }` (fail-closed, same default value
  as before, now scoped only to the permissions fetch).
- Add matching synchronous readers `getGamePermissions`, `getCharacterPermissions`,
  `getTreasurePermissions`.
- `reset()`/`syncForRoute()`/`syncForAuthChange()` behavior is unchanged (still keyed
  into the same `_cache` map, just with more distinct key shapes now).
- `#ensureFromDescriptor` must be updated so a page descriptor triggers **both** the
  access and permissions fetch for its resource (per plan.md: "any code that needs
  `access` must also request `permissions`"), using whatever roles that descriptor
  declares (default: no roles, i.e. real-identity permissions).

## Step 3 — Update call sites reading `can_edit` off an access result

Every production call site the earlier investigation identified as reading `can_edit`
from `AccessStore`'s resource getters must switch to the new permissions getter instead
(same components, just a different `AccessStore` method):
`GameEditController.js`, `GameNpcNewController.js`, `GameTreasureEditController.js`,
`GameSessionNewController.js`, `GameTasksController.js`, `GameSessionsController.js`,
`GameTreasureNewController.js`, `GameTreasuresController.js`, `GamePhotosController.js`,
`BaseCharacterPhotosController.js`, `BaseCharacterTreasuresController.js`,
`TreasureController.js`, `TreasureEditController.js`, `CharacterController.js`,
`GameNpcsController.js`.

`GameController.js`'s `#mergeAccess` currently spreads the *entire* access payload
(`{ ...game, ...access }`) onto the game object — since `access` no longer carries
`can_edit`, this must instead merge from the permissions result for `can_edit`
specifically (either two separate merges, or combine both fetch results into one object
before merging — pick whichever keeps `#mergeAccess`'s call sites unaware of the split).

## Step 4 — `skipCacheSuffixes.js`

`frontend/assets/js/client/config/skipCacheSuffixes.js` currently matches on a static
path-suffix `Set`, with no concept of query params. Since `*/permissions.json` must only
skip cache when there's no `role` param, this check needs to move from a pure suffix-set
match to logic in `BaseClient.js#shouldSkipCache` that, specifically for a
`/permissions.json`-suffixed path, also inspects the outgoing request's query params
(no `role` → skip cache; `role` present → don't skip). `/access.json` keeps its
unconditional suffix-based skip-cache entry, unchanged.

## Step 5 — Consume the backend's resource-kind config, replace `accessRouteConfig.js`'s hardcoded kinds

Per backend.md Step 6, fetch the new resource-kind config endpoint once (e.g. at app
boot, alongside other one-time startup fetches) and cache it in memory. Keep
`accessRouteConfig.js`'s existing per-page `pattern`/`params` arrays as-is (pure URL
routing, not a permission concern — this mirrors `HashRouteResolver`'s own patterns and
must stay in sync with it regardless of this change), but replace the hardcoded `kind`
(and `characterKind`) values in each entry with a lookup into the fetched config,
instead of a literal string. Preserve every existing entry's resulting behavior exactly,
in particular the `superuser`-only branches (`treasureEdit`, `treasureNew`, `treasures`)
and `staffOrSuperuser` entries (`staffUsers`, `staffUser`, `staffUserEdit`) — these must
not collapse into the generic per-resource `access`/`permissions` fetches, since they hit
`/users/status.json`, not a resource's `access.json`/`permissions.json`.

## Files to Change

- `frontend/assets/js/client/GameClient.js` — add `fetchGamePermissions`
- `frontend/assets/js/client/CharacterClient.js` — add `fetchCharacterPermissions`
- `frontend/assets/js/client/TreasureClient.js` — add `fetchTreasurePermissions`
- `frontend/assets/js/utils/AccessStore.js` — split access/permissions fetch+cache,
  update `#ensureFromDescriptor`
- `frontend/assets/js/utils/accessRouteConfig.js` — replace hardcoded `kind` values with
  the fetched backend config
- `frontend/assets/js/client/config/skipCacheSuffixes.js` /
  `frontend/assets/js/client/BaseClient.js` — role-aware skip-cache logic for
  `/permissions.json`
- `frontend/assets/js/components/pages/controllers/GameController.js` — update
  `#mergeAccess`
- Every call site listed in Step 3 — switch from the access getter's `can_edit` to the
  new permissions getter
- `frontend/specs/...` — updated/new specs mirroring every file above

## CI Checks

- `frontend/`: `npm test` (Jasmine specs)
- `frontend/`: `npm run lint`

## Notes

- Confirm the exact shape/name of the backend's resource-kind config endpoint with the
  backend agent before starting Step 5 (see backend.md's Notes).
- No new user-facing strings are introduced by this issue, so no `translator` work is
  needed.
