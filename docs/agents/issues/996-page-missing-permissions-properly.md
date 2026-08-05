# Issue: Page missing permissions properly

## Description
When navigating directly to certain pages, the requester's role-dependent permissions are not
being loaded correctly — they resolve as if the user were not logged in, even for a real DM,
player, or staff member.

Examples:
- `/#/games/:game_slug/items` — loads `/permissions/game.json` without any `role=` parameters
- `/#/games/:game_slug/documents` — loads `/permissions/game.json` without any `role=` parameters

The problem does not happen when using the "view as" role-mocking tool — only when navigating into
the page normally.

## Problem

### Root cause

`AccessStorePermissions.ensureGame`/`ensureCharacter` derive the `role=` query params sent to
`/permissions/*.json` from a **synchronous read** of the corresponding `*Access` cache entry
(`AccessStoreAccess.getGame`/`getCharacter`). That cache entry is only populated when
`AccessStore.syncForRoute()` runs the `game`/`character` access-check descriptor declared for the
current page in `frontend/assets/js/utils/access/accessRouteConfig.js`'s `ROUTE_TEMPLATES`.

`ROUTE_TEMPLATES` was never updated when the item/document feature set was built out (issues
#724, #758, #782, #784, #841, #727, among others), so none of the item/document page keys have an
entry there. On those pages, `syncForRoute` never fires the access fetch, the access cache stays
at its fail-closed default (`is_dm`/`is_player`/`is_owner`/`is_logged` all falsy), so
`AccessStoreRoles.fromAccess` derives zero roles, and `/permissions/*.json` gets called with no
`role=` params — i.e. as if the requester were logged out.

This is a deterministic missing-config gap, not a race condition, and it's masked by the "view as"
role-mocking tool: `AccessStorePermissions.#roleSet` runs the derived roles through
`AccessStoreFacade.rolesForPermissionsRequest`, which — whenever the facade is enabled — ignores
the (broken) real-roles derivation entirely and returns the facade's own configured roles instead.
So testing with the mocking tool never exercises the broken path.

### Scope

The gap isn't limited to the 2 examples above — it affects the entire item/document route family,
game-level and character-level alike, since they all share the same missing-`ROUTE_TEMPLATES`-entry
root cause:

- Game-level: `gameItems`, `gameItem`, `gameItemNew`, `gameItemEdit`, `gameDocuments`,
  `gameDocument`, `gameDocumentNew`, `gameDocumentEdit`, `gameDocumentPhotos`, `gameDocumentFiles`
- Character-level (pcs/npcs): `pcCharacterItems`/`npcCharacterItems`,
  `pcCharacterItem`/`npcCharacterItem`, their `*ItemNew`/`*ItemEdit` variants, and
  `pcCharacterDocument(s)`/`npcCharacterDocument(s)`

Confirmed by direct code read that these controllers call `AccessStore.ensureGamePermissions` or
`AccessStore.ensureCharacterPermissions` and are therefore affected:
`GameItemsController`, `GameItemController`, `GameItemNewController`, `GameDocumentsController`,
`GameDocumentNewController`, `CharacterItemsAccessController`, `CharacterItemNewController`,
`CharacterItemDetailController`.

## Expected Behavior

1. Calling `ensureGame`/`ensureCharacter`/`ensureTreasure` before the corresponding access fetch
   resolves still fires the permissions request immediately (optimistic, default roleSet) — no
   added latency vs. today.
2. Once access resolves with roles different from the optimistic guess, a corrected permissions
   fetch fires and the `ensure*` promise resolves to the **corrected** result — not the stale
   optimistic one.
3. When access was already resolved/cached before `ensure*` is called (today's "happy path"), no
   redundant second fetch fires — same single-call behavior as today.
4. Under an active facade, no corrective fetch ever fires, regardless of what the real access
   resolves to (see "Facade interaction" below).
5. `get*` (synchronous) reads may transiently return the optimistic value until the corrective
   fetch lands — this is acceptable, not a regression, since `get*` has always been a "best known
   value now" API.
6. `AccessCache.reset()` (route change / facade toggle) aborts any in-flight optimistic *or*
   corrective fetch, same as it does today for a single fetch.

## Solution

Rather than patching `accessRouteConfig.js`'s `ROUTE_TEMPLATES` route by route (fragile — the same
gap will keep recurring for every future page that forgets to register a descriptor, and even a
complete `ROUTE_TEMPLATES` doesn't fully close the timing dependency: some controllers, e.g.
`GameItemsController`, call `ensureGamePermissions` immediately on mount with nothing chained in
front of it to give the route-level access fetch time to resolve), fix this at the source in
`AccessStorePermissions`, making `ensureGame`/`ensureCharacter`/`ensureTreasure`
**self-correcting** and independent of route-level config entirely:

1. Compute the roleSet from whatever's in the `*Access` cache *right now* (today that's the
   fail-closed default pre-fetch) and kick off the permissions fetch under that cache key
   immediately, same as today — no added latency in the common case.
2. In parallel, call the corresponding `AccessStoreAccess.ensure*` itself (deduped via
   `AccessCache` — if route-level `syncForRoute` already started it, this just piggybacks the
   existing in-flight request rather than firing a second one).
3. When access resolves, recompute the roleSet. If unchanged, resolve with the optimistic
   permissions result. If it changed, issue a second permissions fetch under the corrected cache
   key (a genuinely different key, since roleSet is part of it — `AccessStoreKeys.gamePermissions`
   etc.) and resolve with that instead.

Because the permissions cache key already encodes the roleSet, step 3's "launch another" falls out
naturally from the existing `AccessCache` machinery — no explicit abort of the optimistic request
is needed, it simply resolves into an unused cache entry. This reuses the same
abort-aware/cancel-and-relaunch machinery `AccessCache`/`AccessStore.setFacade` already centralize
for the "view as" facade's own reset-and-resync flow.

This closes the whole bug class (not just the reported 2 pages, and not just the item/document
family) — every `ensure*Permissions` call becomes correct regardless of whether its page remembered
to register a `game`/`character`/`treasure` descriptor in `accessRouteConfig`, and regardless of
whether its controller happens to chain the call behind another fetch. `accessRouteConfig`
registration remains useful purely as a prefetch/latency optimization, no longer as a correctness
requirement.

Note: `ensure*Access` itself (the plain identity check backing e.g. `#loadCanUploadPhoto`) is
unaffected by this bug — its endpoint takes no `role=` param, so it isn't role-simulated and needs
no self-correction.

### Facade interaction (verified, not a clash)

`AccessStoreFacade.rolesForPermissionsRequest` ignores the real roles entirely whenever the "view
as" facade is enabled (`notLogged` → always `[]`; roles set → always `[...facadeRoles, 'logged']`).
So the self-correcting design is a safe no-op under an active facade: the optimistic (step 1) and
post-access-resolution (step 3) roleSets always compute to the same facade-derived value regardless
of what the `*Access` cache holds, landing on the same cache key — step 3 never fires a redundant
second fetch while the facade is active. If the facade is toggled mid-flight,
`AccessStore.setFacade()` already calls `reset()` first, aborting every in-flight `AccessCache`
entry (including any optimistic permissions fetch) before resyncing, so that transition needs no
extra handling either.

### Test coverage

In `AccessStorePermissionsSpec.js`:

- New case: access resolves *after* permissions is first requested → asserts two calls to
  `fetchGamePermissions` (default roleSet, then corrected), and the final resolved value matches
  the corrected fetch.
- New case: access already cached before `ensureGame` is called → asserts exactly one
  `fetchGamePermissions` call (no regression on the existing "derives the real role set" test).
- New case: facade enabled + access resolves with different real roles later → asserts exactly one
  `fetchGamePermissions` call, using facade-derived roles.
- Mirror all three for `ensureCharacter` and `ensureTreasure`.
- Existing specs' `gameClient`/`characterClient`/`treasureClient` spy objects need
  `fetchGameAccess`/`fetchCharacterAccess`/`fetchTreasureAccess` added wherever missing, since
  `ensure*Permissions` will now unconditionally call the sibling `ensure*Access` too.

## Benefits

- Fixes the reported bug for the 2 example pages and every other affected item/document route in
  one change, instead of a fragile route-by-route config patch.
- Closes off the whole bug class: any future page that forgets to register an `accessRouteConfig`
  descriptor, or that calls `ensure*Permissions` without chaining behind another fetch, still gets
  correct role-scoped permissions.
- No latency regression — the optimistic fetch keeps the common case exactly as fast as today.
- No behavior change under the "view as" facade — verified to be a safe no-op there.
