# Plan: DM should have access to view as feature in the frontend

Issue: [598-dm-should-have-access-to-view-as-feature-in-the-frontend.md](../../issues/598-dm-should-have-access-to-view-as-feature-in-the-frontend.md)

## Overview

Extend the existing "view as" facade (header icon + modal, currently admin/staff-only) so a DM
also sees the icon while on a game page for a game they DM. Since `is_dm` is per-game
(`GameMaster` is a per-game relation — confirmed against `docs/agents/product.md`'s GameMaster
Role section, which states DM authority never crosses into another game), a DM-activated facade
must be scoped to the `game_slug` it was activated on and auto-disengage when the user navigates
away from that game. Admin/staff-activated facades keep their current unscoped behavior. The
icon also gets a visual "engaged" indicator (green background) for both kinds of activation.

This is a frontend-only change — no backend, proxy, or infra work is required.

## Context

- The facade feature already exists: `AccessStoreFacade` (`{enabled, roles}`), surfaced via
  `AccessStore.getFacade()/setFacade()`, edited through `ViewAsModal` /
  `ViewAsModalController.handleSave`, opened from the header icon rendered by
  `HeaderHelper.#renderViewAsLink` when `HeaderViewAsController.checkAvailability()` resolves
  the requester as real staff/superuser (`AccessStore.isReallyAdminOrStaff()`).
- Per-game access (including `is_dm`) is already fetched and cached per `route.gameSlug` in
  `Header.jsx` via `HeaderGameAccessController` / `AccessStore.getGameAccess(gameSlug)`, and
  already re-runs whenever `route.gameSlug` changes.
- `route.gameSlug` itself is derived generically for any `/games/:game_slug/...` route by
  `HeaderRouteResolver` (`GAME_SLUG_PATTERN` regex against the raw hash), independent of
  per-page route config.
- `AccessStore.syncForRoute(pageKey, hash)` already runs on every hash change (wired from
  `AppController`), and already resets/re-syncs per-resource access checks — the natural place
  to also check the facade's stored `game_slug` against the new route and clear it on mismatch,
  per the issue's own suggestion that "this check can be done in the facade object itself".
- `AccessEvents.emitFacadeChanged()` already exists and is emitted once per `setFacade()` call;
  it must also fire when the facade is auto-cleared by the route-mismatch check, so any UI
  (including the new icon indicator) reacts consistently whether the facade changed via the
  modal or via navigation.
- Confirmed with the product-owner agent: no product rule restricts which of the three roles
  (dm/player/owner) a DM may preview as — the existing modal's role list does not need to change.

## Implementation Steps

### Step 1 — Thread `game_slug` into `AccessStoreFacade`

Extend `AccessStoreFacade.set(enabled, roles, gameSlug = null)` to store an optional `gameSlug`
alongside `{enabled, roles}`, returned from `get()` as `{enabled, roles, gameSlug}`. `clear()`
resets it to `null` too.

Add a method (e.g. `AccessStoreFacade.syncRoute(currentGameSlug)`) that clears the facade
(`enabled = false`, `roles` emptied, `gameSlug = null`) whenever a `gameSlug` is stored and it
does not strictly equal `currentGameSlug` (including when `currentGameSlug` is `undefined`,
i.e. the user navigated away from any game page). Facades with no stored `gameSlug` (admin/staff
activations) are never touched by this check. Return whether a clear happened, so the caller
knows whether to emit the change event.

### Step 2 — Wire the route-mismatch check into `AccessStore`

In `AccessStore.syncForRoute(pageKey, hash)`, derive the current `game_slug` from `hash` (reuse
the same matching approach `HeaderRouteResolver.GAME_SLUG_PATTERN` already uses — extract it to
a small shared helper rather than duplicating the regex, since both call sites need identical
"which game, if any, does this hash belong to" semantics) and call
`AccessStoreFacade.syncRoute(gameSlug)` before the existing reset/re-ensure logic runs, so any
descriptor fetches triggered later in the same call already see the (possibly just-cleared)
facade. If the sync cleared the facade, call `AccessEvents.emitFacadeChanged()`.

### Step 3 — Store `game_slug` when a non-admin activates the facade

Thread the current `route.gameSlug` down to `ViewAsModal` (new prop, passed from `Header.jsx`,
which already has `route.gameSlug`) and through to `ViewAsModalController.handleSave`.

Centralize the admin-vs-DM branching in `AccessStore.setFacade({enabled, roles, gameSlug})`:
when the requester is really staff/superuser (`AccessStore.isStaffOrSuperUser()` — already
populated synchronously by the time the icon is visible, since `checkAvailability()` resolved it
on mount), store `gameSlug: null` (unscoped, current behavior); otherwise store the passed-in
`gameSlug`. This keeps `ViewAsModalController` a thin pass-through of "the current game_slug",
with no admin-awareness of its own.

### Step 4 — Show the icon for DMs, per game

In `Header.jsx`, derive the icon's visibility as `canViewAs || Boolean(gameAccess.is_dm)` when
building the `state` object passed to `HeaderHelper.render` (around line 85). `gameAccess` is
already refetched whenever `route.gameSlug` changes, so no new effect is needed —
`HeaderViewAsController.checkAvailability()` keeps doing only the real admin/staff check, unchanged.

### Step 5 — Green "engaged" indicator on the icon

In `Header.jsx`, subscribe to `AccessEvents.subscribeFacadeChanged` (alongside the existing
`AuthEvents.subscribe` in the mount effect) to keep a `facadeEnabled` state in sync with
`AccessStore.getFacade().enabled` (seed it the same way on mount). Pass `facadeEnabled` through
to `HeaderHelper.render`'s state and into `#renderViewAsLink`, adding a class (e.g.
`view-as-active`) to the icon/link when true. Add the corresponding small SCSS rule (green
background) to `frontend/assets/css/main.scss`. This applies identically to DM and admin/staff
activations, and also reacts correctly when the facade is auto-disengaged by navigation (Step 2
already emits the change event in that case).

### Step 6 — Tests

Update/add Jasmine specs alongside each changed unit (mirroring `specs/` structure):
- `AccessStoreFacadeSpec.js` — `gameSlug` storage, `syncRoute` clear/keep matrix.
- `AccessStoreDescriptorSpec.js` / a new `AccessStoreSpec.js` case (or wherever `syncForRoute` is
  currently tested) — the route-mismatch clears the facade and emits the change event.
- `ViewAsModalControllerSpec.js` / `ViewAsModalSpec.js` — `gameSlug` prop threading into `handleSave`.
- `HeaderViewAsControllerSpec.js` — unchanged behavior, confirm no regression.
- `HeaderHelper/viewAsLinkSpec.js` — icon shown for `gameAccess.is_dm`, `view-as-active` class
  toggling with `facadeEnabled`.
- `HeaderSpec.js` — combined visibility (`canViewAs || is_dm`) and facade-changed subscription/cleanup.
- `HeaderRouteResolverSpec.js` — only touch if the game-slug-from-hash logic is extracted to a
  shared helper and this spec's coverage moves with it.

## Files to Change

- `frontend/assets/js/utils/access/store/AccessStoreFacade.js` — add `gameSlug` field, `syncRoute` mismatch/clear logic.
- `frontend/assets/js/utils/access/store/AccessStore.js` — `getFacade()`/`setFacade()` thread `gameSlug`; `isStaffOrSuperUser()`-based scoping decision; `syncForRoute()` calls `AccessStoreFacade.syncRoute()` and emits the change event on clear.
- `frontend/assets/js/components/common/controllers/HeaderRouteResolver.js` — extract the game-slug-from-hash regex into a small shared helper reusable from `AccessStore`.
- `frontend/assets/js/components/common/ViewAsModal.jsx` — accept and forward a `gameSlug` prop.
- `frontend/assets/js/components/common/controllers/ViewAsModalController.js` — `handleSave` forwards `gameSlug` to `AccessStore.setFacade`.
- `frontend/assets/js/components/common/Header.jsx` — pass `route.gameSlug` into `ViewAsModal`; derive combined `canViewAs`; add `facadeEnabled` state + `AccessEvents.subscribeFacadeChanged`/`unsubscribeFacadeChanged`.
- `frontend/assets/js/components/common/helpers/HeaderHelper.jsx` — `#renderViewAsLink` adds the `view-as-active` class when engaged.
- `frontend/assets/css/main.scss` — new small rule for the engaged icon's green background.
- Specs listed in Step 6.

## CI Checks

- `frontend`: `npm run lint && npm run coverage` (CI jobs: `frontend-checks`, `jasmine`)

## Notes

- Edge case: a user who is both a real admin/staff *and* DM of the current game — treated as
  admin (unscoped facade), consistent with admins already being able to view-as anywhere; no
  special-casing needed since `isStaffOrSuperUser()` is checked first in Step 3.
- The modal's role choices (dm/player/owner) are unchanged for DM activations — confirmed with
  product-owner that no product rule restricts this.
- No new translation strings are introduced (existing `header.view_as_alt` key is reused), so no
  translator-agent work is needed.
