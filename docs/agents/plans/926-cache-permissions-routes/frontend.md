# Frontend Plan: Cache permissions routes

Main plan: [plan.md](plan.md)

## Shared contracts

Call the 4 new backend routes from [plan.md](plan.md#shared-contracts) instead of the old
per-entity ones. Client method signatures (which still take `gameSlug`/`characterId`/`id`) stay
the same — those are still needed for the frontend's own `AccessCache` keying — only the outgoing
HTTP path changes to drop the entity id. Never send `X-Skip-Cache: true` on these requests.

## Context

Three client methods build the outgoing request:
- `GameClient.fetchGamePermissions` (`frontend/assets/js/client/GameClient.js:44-45`) — builds
  `/games/${gameSlug}/permissions.json${roleQuery}`
- `TreasureClient.fetchTreasurePermissions` (`frontend/assets/js/client/TreasureClient.js:44-45`)
  — builds `/treasures/${id}/permissions.json${roleQuery}`
- `CharacterClient.fetchCharacterPermissions` (`frontend/assets/js/client/CharacterClient.js:65-67`)
  — delegates to the shared `#fetchCharacter` helper (`CharacterClient.js:163-172`), which builds
  `/games/${gameSlug}/${characterKind}/${characterId}/permissions.json${query}` and, separately,
  applies its own NPC-specific skip-cache logic (`characterKind === 'npcs' && ...`) that does not
  apply to `permissions` (its suffix list is `null`/`treasures`/`items`/`documents`) — leave that
  logic alone, it doesn't cover this endpoint.

Separately, `BaseClient#shouldSkipCache` (`frontend/assets/js/client/BaseClient.js:79-93`)
special-cases any GET path ending in `/permissions.json`: it adds `X-Skip-Cache: true` only when
no `role` param is present. This exists so that a permissions request accidentally made without
roles (uncacheable, since it wouldn't reflect a specific simulated identity) still bypasses cache.
This suffix check will silently stop matching once the path changes to `/permissions/<entity>.json`
— it needs to be updated, not left to rot.

Callers always supply a role set today (`AccessStorePermissions`'s `#roleSet`, derived from
`AccessStoreRoles.fromAccess`, is never empty in practice for a resolved `*Access` payload — see
`frontend/assets/js/utils/access/store/AccessStorePermissions.js:161-165`), but the "no role
param" case is still reachable in principle, so keep an equivalent safeguard rather than deleting
it outright.

## Implementation Steps

### Step 1 — Point the clients at the new URLs

- `GameClient.fetchGamePermissions`: change the path to `/permissions/game.json${roleQuery}`
  (drop `gameSlug` from the URL; keep it as a parameter since it's unused by the request but
  check whether it's still needed elsewhere in the method signature/callers — if entirely unused
  after this change, it's fine to leave the parameter for call-site symmetry with
  `fetchGameAccess`, but do not silently change the public method signature beyond the path).
- `TreasureClient.fetchTreasurePermissions`: change the path to
  `/permissions/treasure.json${roleQuery}`.
- `CharacterClient`: `fetchCharacterPermissions` can no longer share `#fetchCharacter` (that
  helper is entity-id-based by construction). Give it its own small path builder that maps
  `characterKind` (`'pcs'`/`'npcs'`) to the new entity segment (`'game_pc'`/`'game_npc'`) and
  requests `/permissions/game_pc.json${query}` or `/permissions/game_npc.json${query}`, reusing
  `#buildCharacterQuery`/`buildRoleQuery` for the query string exactly as before.

### Step 2 — Update `BaseClient#shouldSkipCache`

Replace the `pathname.endsWith('/permissions.json')` branch
(`frontend/assets/js/client/BaseClient.js:83-85`) with an equivalent check against the new
`/permissions/` prefix (e.g. `pathname.startsWith('/permissions/')`), keeping the same
"skip cache only when no `role` param is present" behavior. Update the method's docstring
(lines 62-78) to describe the new path shape.

### Step 3 — Tests

- Update `frontend/specs/assets/js/client/GameClient/fetchGamePermissionsSpec.js`,
  `TreasureClient/fetchTreasurePermissionsSpec.js`,
  `CharacterClient/fetchCharacterPermissionsSpec.js` to assert the new paths.
- Update `frontend/specs/assets/js/client/BaseClient/skipCacheHeaderSpec.js`'s
  `/permissions.json`-focused cases (lines ~189-275) to use the new `/permissions/<entity>.json`
  paths, covering: no-role GET → skip-cache added; role param present → not added; several role
  params → not added.
- Confirm no other spec still asserts the old `/games/:slug/permissions.json`-style path for
  these three fetch methods.

## Files to Change

- `frontend/assets/js/client/GameClient.js` — new path in `fetchGamePermissions`
- `frontend/assets/js/client/TreasureClient.js` — new path in `fetchTreasurePermissions`
- `frontend/assets/js/client/CharacterClient.js` — new path builder for
  `fetchCharacterPermissions`
- `frontend/assets/js/client/BaseClient.js` — `#shouldSkipCache`'s permissions special-case
- Associated spec files listed in Step 3

## CI Checks

- `frontend`: `docker-compose run --rm majora_fe yarn test` / `npm run coverage` (CI job:
  `jasmine`)
- `frontend`: `docker-compose run --rm majora_fe yarn lint` (CI job: `frontend-checks`)

## Notes

- `AccessStorePermissions`/`AccessStoreKeys` (the frontend's own in-memory permissions cache,
  separate from Tent's HTTP cache) are unaffected — they keep keying by `gameSlug`/`characterId`/
  `id` plus role set regardless of what the outgoing HTTP path looks like, so no changes needed
  there.
