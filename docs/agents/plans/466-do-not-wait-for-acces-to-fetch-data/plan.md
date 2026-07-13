# Plan: Do not wait for access to fetch data

Issue: [466-do-not-wait-for-acces-to-fetch-data.md](../../issues/466-do-not-wait-for-acces-to-fetch-data.md)

## Overview

`GameController`, `CharacterController`, and `TreasureController` each gate their initial
`setGame`/`setCharacter`/`setTreasure` call behind a `Promise.all` on `AccessStore.ensure*Access`/
`ensure*Permissions`, so every page load lingers on `access.json`/`permissions.json` even though
`AccessStore` already exposes synchronous, fail-closed (deny-all) readers
(`getGameAccess`, `getGamePermissions`, etc. — see `AccessStoreAccess.js`/`AccessStorePermissions.js`)
that return defaults instantly while a fetch is still pending. This plan makes the three page
controllers render immediately using those synchronous deny-all defaults, then re-run their own
load pipeline exactly once — the same page-controller function used for the initial load — as soon
as the real access/permissions data resolves, so the page ends up in the same state it would reach
today, just without blocking the first render on the network round-trip.

## Context

- `AccessStore.ensure*Access`/`ensure*Permissions` (`frontend/assets/js/utils/AccessStore.js`)
  delegate to `AccessCache#ensure`, which dedupes concurrent fetches, resolves to a cached value on
  repeat calls, and fails closed to `ACCESS_DEFAULT`/`PERMISSIONS_DEFAULT` on error — but only after
  the request settles.
- `AccessStore.getGameAccess`/`getGamePermissions` (and the character/treasure equivalents) already
  read the cache **synchronously**, returning the same fail-closed defaults instantly when nothing
  is cached yet (`AccessCache#read`). These are currently unused by the three page controllers.
- `AppController.buildEffect()` (`frontend/assets/js/components/AppController.js:66`) already calls
  `AccessStore.syncForRoute(page, hash)` on mount and on every hash change, independently of the
  page controllers — this is what actually kicks off the `access.json`/`permissions.json` fetches
  for the current route's descriptors (`accessRouteConfig`). The page controllers' own
  `ensure*Access`/`ensure*Permissions` calls piggyback on the same cache (deduped, no extra network
  call in the common case).
- `AccessStore.syncForAuthChange()` (`AccessStore.js:281-289`) is the existing "reload as if just
  logged in" mechanism: it clears the facade, resets the whole access cache, and re-runs
  `syncForRoute` for the last-recorded route. It is triggered today via `AuthEvents` from
  `AppController.js:74`. It intentionally is **not** reused verbatim for the per-page reload this
  issue asks for: `syncForAuthChange` resets and re-fetches *every* descriptor for the route, so
  wiring it directly to "an access/permissions fetch just settled" would recurse (its own re-fetch
  settling would re-trigger it, forever). The three page controllers instead apply the same
  *pattern* — re-run their own load pipeline once, exactly as if the page had just been entered
  fresh — driven off the `ensure*` promises they already hold, which each resolve exactly once per
  cache entry (a repeat `ensure()` call against an already-`'ready'` key resolves immediately with
  no new fetch, so there is no risk of the reload retriggering itself).
- `CharacterController.fetchAndMergeAccess` additionally uses the resolved `can_edit` permission to
  decide whether to fetch the full (DM-only) character (`loadFullCharacter`). Rendering first with
  the deny-all default and then re-running the same pipeline once the real permission arrives is
  what naturally lets the deferred full-character fetch happen once `can_edit` turns out to be
  `true` — no separate mechanism is needed for that case.

## Implementation Steps

### Step 1 — Render `GameController` immediately with synchronous defaults

In `#fetchGame`/`#mergeAccess` (`GameController.js`), stop awaiting
`AccessStore.ensure*` before the first `setGame` call. Merge the game with
`AccessStore.getGameAccess(gameSlug)`/`getGamePermissions(gameSlug)` (synchronous, deny-all until
resolved) and call `setGame` right away. Keep starting `AccessStore.ensureGameAccess`/
`ensureGamePermissions` (still needed so the real values eventually populate the cache), and once
both resolve, call the same game-loading path again (re-merge with the now-resolved getters and
`setGame` again) so the page picks up the real access/permissions — mirroring, at the page level,
the same "resync as if freshly entered" idea `AccessStore.syncForAuthChange()` already applies for
login/logout.

### Step 2 — Render `CharacterController` immediately with synchronous defaults

In `fetchAndMergeAccess`/`loadCharacter` (`CharacterController.js`), merge the base character with
`AccessStore.getCharacterAccess(...)`/`getCharacterPermissions(...)` synchronously and call
`setCharacter` right away (skipping `loadFullCharacter` while `can_edit` is still the default
`false`), instead of blocking on `Promise.all([ensureCharacterAccess, ensureCharacterPermissions])`
first. Keep starting the `ensure*` calls in the background; once both resolve, re-run the same
merge-and-load path (which will now correctly call `loadFullCharacter` if the resolved `can_edit` is
`true`) and `setCharacter` again.

### Step 3 — Render `TreasureController` immediately with synchronous defaults

In `#fetchTreasureWithAccess` (`TreasureController.js`), fetch the treasure itself and merge it with
`AccessStore.getTreasurePermissions(id)` (synchronous default) without waiting on
`AccessStore.ensureTreasurePermissions(id)` first. Keep starting `ensureTreasurePermissions` in the
background and re-merge/`setTreasure` again once it resolves.

### Step 4 — Guard against redundant/late reloads

For all three controllers, reuse the existing `mounted`/`safeSet` guard (`buildSafeSetter`) for the
deferred second `set*` call, same as the initial one, so a reload arriving after the component
unmounted or the route changed again is a no-op. Since each `ensure*` promise only resolves once per
cache entry, no additional dedup/guard is needed to prevent multiple reloads from a single page
visit.

### Step 5 — Update/add specs

Existing specs assert the current blocking `Promise.all` behavior (e.g.
`CharacterController/fetchAndMergeAccessSpec.js`, `GameController/canEditSpec.js`,
`TreasureControllerSpec.js`). Update them to assert the new two-phase behavior: `set*` is called
first with deny-all defaults before the access/permissions fetch resolves, and called again with the
real values after it resolves. Add coverage for the `CharacterController` case where the second
render newly triggers `loadFullCharacter` because the resolved `can_edit` flipped to `true`.

## Files to Change

- `frontend/assets/js/components/resources/game/pages/controllers/GameController.js` — render with
  synchronous defaults first, reload once `ensure*` resolves.
- `frontend/assets/js/components/resources/character/pages/controllers/CharacterController.js` —
  same, plus deferred `loadFullCharacter` once `can_edit` resolves `true`.
- `frontend/assets/js/components/resources/treasure/pages/controllers/TreasureController.js` — same.
- `frontend/specs/assets/js/components/resources/game/pages/controllers/GameController/*.js` —
  update specs covering `#mergeAccess`/`canEditSpec`/`gameDetailFetchSpec`.
- `frontend/specs/assets/js/components/resources/character/pages/controllers/CharacterController/fetchAndMergeAccessSpec.js`,
  `loadCharacterSpec.js`, `loadFullCharacterSpec.js` — update specs.
- `frontend/specs/assets/js/components/resources/treasure/pages/controllers/TreasureControllerSpec.js` —
  update specs.

## CI Checks

- `frontend`: `npm test` (Jasmine specs), `npm run lint` (CI job: frontend checks in
  `.circleci/config.yml`)

## Notes

- `AccessStore.syncForAuthChange()` itself is left unchanged — it already does the right thing for
  actual login/logout. This issue's "reload as if just logged in" is implemented at the page-
  controller level by re-running each controller's own load pipeline once, not by calling
  `syncForAuthChange()` directly, to avoid the recursive re-fetch/reload loop that would otherwise
  result (see Context above).
- No backend, proxy, or infra changes are needed — this is a frontend-only rendering-timing change,
  and it doesn't alter who can see or edit what (the deny-all default is already today's fail-closed
  behavior on fetch error; this issue only makes it apply for the brief in-flight window too).
