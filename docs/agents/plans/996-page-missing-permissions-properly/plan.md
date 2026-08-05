# Plan: Page missing permissions properly

Issue: [996-page-missing-permissions-properly.md](../issues/996-page-missing-permissions-properly.md)

## Overview

Make `AccessStorePermissions.ensureGame`/`ensureCharacter`/`ensureTreasure` self-correcting instead
of depending on `accessRouteConfig.js` having pre-populated the sibling `*Access` cache entry
before they're called. Each method fires its permissions fetch optimistically (using whatever
role set the `*Access` cache currently holds — today's fail-closed default when nothing has
populated it yet), in parallel calls its own `AccessStoreAccess.ensure*` (deduped, so no extra
network call if `syncForRoute` already started one), and — only if the resolved access implies a
different role set than the optimistic guess — issues a corrected permissions fetch and resolves
to that instead. This removes the reported bug's root dependency on `accessRouteConfig.js`
entirely, closing the whole bug class rather than patching the specific routes currently missing
an entry. Entirely within the `frontend` agent's scope.

## Context

`AccessStorePermissions.#roleSet` is a synchronous read of `AccessStoreAccess.getGame`/`getCharacter`
(a plain cache lookup, no fetch). That cache entry is only populated when
`AccessStore.syncForRoute()` runs the `game`/`character` descriptor `accessRouteConfig.js` declares
for the current page. The item/document route family (`gameItems`, `gameDocuments`, and ~16 related
page keys) has no such descriptor — see the issue for the full list and confirmed affected
controllers — so on those pages the access cache never gets populated, `AccessStoreRoles.fromAccess`
derives zero roles, and `/permissions/*.json` is requested with no `role=` params (i.e. as if
logged out). This is masked by the "view as" facade because
`AccessStoreFacade.rolesForPermissionsRequest` ignores the real-roles derivation entirely whenever
the facade is enabled.

Full root-cause/design write-up, including the facade-interaction analysis, lives in the issue file
linked above — this plan implements that design.

## Implementation Steps

### Step 1 — Extract a role-set-scoped permissions fetcher

In `frontend/assets/js/utils/access/store/AccessStorePermissions.js`, factor the existing
fetch/cache logic (currently inline in each `ensure*` method) into a private helper that takes an
already-computed `roleSet` and just does the `#loggedEnsure` call under
`AccessStoreKeys.gamePermissions(gameSlug, roleSet)` (and the character/treasure equivalents). This
is the piece both the optimistic and corrective fetch in Step 2 will call with different role sets.

### Step 2 — Make `ensureGame` self-correcting

Rewrite `AccessStorePermissions.ensureGame(cache, gameClient, gameSlug)`:

1. Compute `optimisticRoleSet` from `AccessStoreAccess.getGame(cache, gameSlug)` (today's
   synchronous read) and kick off the Step 1 fetcher under that role set immediately — this is the
   existing behavior, unchanged in the common case.
2. In parallel, call `AccessStoreAccess.ensureGame(cache, gameClient, gameSlug)` (deduped by
   `AccessCache` against any fetch `syncForRoute` already started).
3. When that resolves, recompute the role set from the resolved access payload
   (`correctedRoleSet`). Compare `AccessStoreKeys.gamePermissions(gameSlug, correctedRoleSet)`
   against the optimistic call's key:
   - Same key → resolve with the optimistic fetch's result (no second network call; `AccessCache`
     would dedupe it even if re-invoked, but skip the redundant call for clarity).
   - Different key → call the Step 1 fetcher again under `correctedRoleSet` and resolve with
     *that* result instead.

### Step 3 — Mirror for `ensureCharacter` and `ensureTreasure`

Apply the same restructuring to `ensureCharacter` (role set from
`AccessStoreAccess.getCharacter`/`ensureCharacter`) and `ensureTreasure` (role set from
`AccessStoreAccess.getTreasure`/`ensureTreasure` — note `ensureTreasure`'s `isExclusive` parameter
only affects which permissions endpoint variant is requested, not the access lookup, so thread it
through to both the optimistic and corrective Step-1-fetcher calls, unchanged from today).

### Step 4 — Verify no behavior change for `get*` and the facade path

- `getGame`/`getCharacter`/`getTreasure` (synchronous, no-fetch reads) are unchanged — they may
  transiently reflect the optimistic role set until the corrective fetch lands and re-populates the
  cache under the corrected key; this is the accepted "best known value now" contract (see the
  issue's acceptance criteria).
- Confirm by inspection (and the new specs in Step 5) that under an active facade, the optimistic
  and corrected role sets always compute to the same value (since
  `AccessStoreFacade.rolesForPermissionsRequest` ignores the real access payload whenever enabled),
  so no corrective fetch ever fires while the facade is active.

### Step 5 — Update `AccessStorePermissionsSpec.js`

- Add a case per resource (`ensureGame`/`ensureCharacter`/`ensureTreasure`): access resolves *after*
  permissions is first requested → assert two calls to `fetchGamePermissions`/etc. (default role
  set, then corrected), and that the final resolved value matches the corrected fetch's response.
- Add a case per resource: access already cached before `ensure*` is called → assert exactly one
  permissions fetch call (no regression on the existing "derives the real role set" tests).
- Add a case per resource: facade enabled + access resolves later with different real roles →
  assert exactly one permissions fetch call, using the facade-derived role set.
- Update every existing `gameClient`/`characterClient`/`treasureClient` spy object in this spec
  file to also stub `fetchGameAccess`/`fetchCharacterAccess`/`fetchTreasureAccess` wherever missing,
  since `ensure*Permissions` now unconditionally calls the sibling `ensure*Access` too — spies
  missing that method will throw once Step 2/3 land.
- Check `frontend/specs/assets/js/utils/access/store/AccessStoreKeysSpec.js` and any other spec
  that constructs `gameClient`/`characterClient`/`treasureClient` spies and exercises
  `AccessStorePermissions` indirectly (e.g. controller specs mocking `AccessStore.ensureGamePermissions`
  itself are unaffected, but any spec instantiating the real store chain needs the same
  `fetchGameAccess`-style stub added).

### Step 6 — Full verification

Run the full frontend lint + Jasmine suite (see CI Checks below) after the change, since
`AccessStorePermissions` is exercised transitively by many controller specs across the item,
document, character, and treasure page families — confirm none of them break from the new
unconditional `ensure*Access` call.

## Files to Change

- `frontend/assets/js/utils/access/store/AccessStorePermissions.js` — self-correcting
  `ensureGame`/`ensureCharacter`/`ensureTreasure`, per Steps 1–3.
- `frontend/specs/assets/js/utils/access/store/AccessStorePermissionsSpec.js` — new
  self-correction/facade-no-op/happy-path-dedup cases, plus spy updates, per Step 5.
- Possibly other spec files under `frontend/specs/assets/js/**` that construct a real
  `gameClient`/`characterClient`/`treasureClient` spy consumed by the real `AccessStorePermissions`
  chain (rather than mocking `AccessStore` itself) — audit and update as needed per Step 5/6.

## CI Checks

- `frontend`: `npm run lint` (CI job: `frontend-checks`)
- `frontend`: `npm run coverage` (CI job: `jasmine`)

Run these through the containerized toolchain per `AGENTS.md`, e.g.
`docker-compose run --rm majora_fe yarn lint` / `docker-compose run --rm majora_fe npm run coverage`
— never invoke `yarn`/`npm` directly on the host.

## Notes

- This issue is entirely within the `frontend` agent's scope (`frontend/assets/js/utils/access/**`
  and its specs) — no backend, proxy, infra, cache, or translator work, so this plan is not split
  by agent.
- No product/access-control or security review is needed: this changes *when* an already-correct
  permissions check fires, not *what* it's allowed to check or *who* can call it — no new endpoint,
  field, or auth boundary is introduced.
- The issue's "Scope" section lists ~18 page keys confirmed missing from `accessRouteConfig.js`.
  This plan deliberately does **not** add those entries — the self-correcting design makes that
  registration a pure prefetch/latency optimization rather than a correctness requirement, per the
  issue's "Solution" section. Do not reintroduce a route-by-route config patch as part of this
  work; if a future latency optimization wants to register these routes anyway, that's a separate,
  optional follow-up.
