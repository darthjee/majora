# Plan: Fix players link

Issue: [709-fix-players-link.md](../../issues/709-fix-players-link.md)

## Overview

The game dropdown's "Players" (and "Polls"/"Sessions") items never render because `Header`'s
own game-access fetch always loses a mount-order race against `AppController`'s route sync,
which resets/aborts it before it resolves. Fix `HeaderGameAccessController`/`Header` so the
game access state is resilient to that reset — either by re-fetching once the reset settles or
by reading from the store instead of only trusting the one-shot fetch promise — and add a
Jasmine spec that reproduces the race and asserts the fix.

## Context

- `HeaderNavHelper#renderGameAccessNavItems` (`frontend/assets/js/components/common/header/helpers/HeaderNavHelper.jsx`)
  gates the Players/Polls/Sessions dropdown items on `state.gameAccess.{is_dm,is_player,is_superuser,is_staff}`.
  This condition and the roles it checks are already correct — the bug is not here.
- `gameAccess` state comes from `Header.jsx`'s `useEffect(() => gameAccessController.buildEffect(route.gameSlug)(), [route.gameSlug])`,
  which calls `HeaderGameAccessController#buildEffect` → `AccessStore.ensureGameAccess(gameSlug)` → `AccessCache#ensure`.
- Confirmed by reading `AppHelper.jsx` (`Header` is rendered as a child of `App`'s output tree)
  and React's effect-firing order (children before parents): on the **initial mount** of any
  game-scoped route, this sequence happens:
  1. `Header`'s effect fires first, starting `AccessCache#ensure('game-access:<slug>', ...)`
     with a fresh `AbortController`, registering a `pending` cache entry.
  2. `App.jsx`'s own effect then fires, calling `AppController#buildEffect()`'s returned
     function, which **synchronously** calls `AccessStore.syncForRoute(...)` on line 76 of
     `AppController.js` — not just inside the `hashchange` handler.
  3. `syncForRoute` (`AccessStore.js` lines 256-268) starts with `AccessStore.reset()`, which
     (`AccessCache.js` `reset()`, lines 64-67) calls `.abort()` on every pending entry's
     controller — including the one `Header` just registered — then clears the cache map.
  4. The abort rejects `Header`'s fetch with an `AbortError`; `AccessCache#fail`
     (lines 79-92) sees `error.name === 'AbortError'`, deletes the (already-cleared) cache
     entry, and resolves with the caller-supplied `defaultValue` — the fail-closed
     `ACCESS_DEFAULT` from `AccessStoreAccess.js` (`is_superuser: null, is_staff: null,
     is_dm: null, is_player: false`).
  5. `HeaderGameAccessController#buildEffect`'s `.then` (lines 40-44) calls
     `this.setGameAccess(access)` with that all-falsy default. `Header`'s effect has a
     `[route.gameSlug]` dependency that doesn't change again, so nothing re-runs it.
  6. Nothing in `Header.jsx` subscribes to the plain `access:changed` `AccessEvents` (only
     `subscribeFacadeChanged` is used), so even if the store's cache is later repopulated
     correctly, `Header`'s local `gameAccess` state is never refreshed.
- Confirmed via `frontend/assets/js/utils/access/accessRouteConfig.js`'s `ROUTE_TEMPLATES` that
  the `gamePlayers` page key has **no descriptor entry at all** (unlike `game`, `gameNpcs`,
  `gamePolls`, etc.) — so even the app-level `syncForRoute` re-fetch (triggered right after
  `reset()`, for pages that do have a `'game'` descriptor) never runs for the Players page
  itself. `Header`'s own effect is the *only* source of `gameAccess` for every game-scoped
  route, and it always loses this race on first mount, regardless of which specific game page
  is loaded — this matches the issue's report that the link is missing on any page under
  `/#/games/:game_slug/...`.
- Client-side navigation between two different game slugs (without a full reload) is not
  affected the same way — `AccessStore.reset()` there runs inside the `hashchange` handler,
  which fires before `Header`'s effect re-runs for the new `gameSlug`, so there's no race in
  that path.

## Implementation Steps

### Step 1 — Make the header's game-access fetch resilient to being reset mid-flight

In `frontend/assets/js/components/common/header/controllers/HeaderGameAccessController.js`,
change `buildEffect` so it no longer trusts a single `ensureGameAccess(gameSlug).then(...)` call
in isolation. Subscribe to `AccessEvents` (`AccessEvents.subscribe`, the plain
`access:changed` channel already emitted by `AccessCache#settle`/`#fail` on every non-abort
settle) for the lifetime of the effect, and on each event re-read
`AccessStore.getGameAccess(gameSlug)` (a synchronous cache read, no new fetch) into state —
in addition to the existing one-shot `ensureGameAccess` call. This way, whichever fetch
actually wins the race (`Header`'s own, or the one `AccessStore.syncForRoute` restarts for
pages with a `'game'` descriptor) still reaches `Header`'s state once it settles.

This alone does not fix `gamePlayers` (no `'game'` descriptor, so nothing re-fetches after the
abort). Also change `buildEffect` to re-issue `ensureGameAccess(gameSlug)` itself once, after
detecting its own request was aborted — simplest correct trigger: call
`AccessStore.ensureGameAccess(gameSlug)` again from a microtask/rerun after the initial
promise resolves to the fail-closed default `is_player === false && is_dm == null &&
is_staff == null && is_superuser == null` (the exact shape of `ACCESS_DEFAULT` in
`AccessStoreAccess.js`), since a genuine (non-raced) resolution to "no access at all" is
indistinguishable from the aborted default by payload alone — treat this as "retry once
per mount if the very first settle is the aborted default," not as unconditional double-fetching.

Confirm during implementation whether it's simpler/more robust to instead delay `Header`'s
fetch until after `AccessStore.reset()`/`syncForRoute` has run for the current mount (e.g. by
having `AppController#buildEffect` emit something `Header` can key off, or by having
`HeaderGameAccessController` itself call `AccessStore.ensureGameAccess` from inside an
`AccessEvents.subscribe` callback keyed to the app's own sync completing) rather than
racing-then-retrying. Pick whichever approach keeps `HeaderGameAccessController` and
`Header.jsx` simplest; both are valid per the issue's "Solution" section.

### Step 2 — Add a Jasmine spec reproducing the race

In `frontend/specs/assets/js/components/common/header/controllers/HeaderGameAccessControllerSpec.js`
(mirror the existing spec file for this controller, or create it if it doesn't exist — check
first), add a spec that:
- Stubs `AccessStore.ensureGameAccess` to reject with `{ name: 'AbortError' }` (simulating the
  raced/aborted fetch), and asserts `setGameAccess` is still eventually called with a
  non-default (real) access payload once a follow-up resolution/event occurs — i.e. the
  controller recovers instead of getting stuck on the fail-closed default.
- Keep the existing "no gameSlug → no-op" and "happy path" cases passing.

Check `frontend/specs/assets/js/components/common/header/HeaderSpec.js` (or equivalent) for
whether a similar effect-ordering scenario should also be covered at the `Header` component
level; add a case there only if the existing spec structure makes it a small addition — don't
introduce a new heavyweight test harness for this fix alone.

## Files to Change

- `frontend/assets/js/components/common/header/controllers/HeaderGameAccessController.js` — make the game-access fetch resilient to being aborted by `AccessStore.reset()` on initial mount.
- `frontend/assets/js/components/common/header/Header.jsx` — adjust only if the chosen fix requires wiring a new subscription/cleanup here (e.g. passing an extra callback into `HeaderGameAccessController`).
- `frontend/specs/assets/js/components/common/header/controllers/HeaderGameAccessControllerSpec.js` — new/updated spec covering the abort-then-recover scenario.

## CI Checks

- `frontend`: `npm run coverage` (CI job: `jasmine`)
- `frontend`: `npm run lint` (CI job: `frontend-checks`)

## Notes

- The role-check condition in `HeaderNavHelper.jsx` (`is_dm || is_player || is_superuser || is_staff`) is already correct and should not need to change.
- Do not "fix" this by adding `gamePlayers` (or other missing pages) to `accessRouteConfig.js`'s `ROUTE_TEMPLATES` — that config drives real permission/edit-permission fetches for pages that need them, and `gamePlayers` intentionally has none; `Header`'s own fetch must be made self-sufficient instead of leaning on the app-level route sync.
- Verify manually (or via the new spec) that the fix also holds for the very first page a user lands on directly via a full page load/hash URL (not just client-side navigation), since that's the specific scenario that reproduces the race.
