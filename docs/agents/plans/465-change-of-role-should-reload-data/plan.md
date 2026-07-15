# Plan: Change of role should reload data

Issue: [465-change-of-role-should-reload-data.md](../issues/465-change-of-role-should-reload-data.md)

## Overview

Make currently-mounted pages react in place when the "view as" facade is saved, instead of staying stale until the user manually navigates away and back. The fix stays within the existing `AccessStore`/`AccessEvents` pub-sub pattern (no `window.location.reload()`), by adding a dedicated "facade changed" signal that pages subscribe to and use to re-run their existing data-loading effect.

## Context

The "view as" feature (`ViewAsModal` → `ViewAsModalController.handleSave` → `AccessStore.setFacade({enabled, roles})`) already resets `AccessStore`'s cache and re-syncs every access/permission descriptor configured for the current route (`AccessStore.syncForRoute`), re-fetching each `*Access`/`*Permissions` check and emitting the generic `access:changed` event (`AccessEvents`) as each one resolves.

The actual gap: nothing outside `AccessStore`/`AccessCache` currently subscribes to `access:changed`. Every page controller that consumes access/permissions (e.g. `GameController#buildEffect` → `#renderGame` → `Promise.all([ensureGameAccess, ensureGamePermissions])` → `#mergeAccess`) only runs that merge once, in the `useEffect` that fires on mount (`Game.jsx`: `useEffect(() => controller.buildEffect()(), [controller])`). If the "view as" modal is opened and saved while a page is already mounted, `AccessStore`'s internal cache does get refreshed, but the page never re-reads it and never re-renders — so the user only sees the effect after navigating to a different page and back.

Reusing the existing `access:changed` event directly is not a good fit: it fires once per resolved cache key, including for the page's own ordinary first-load fetches, so a naive subscriber would re-run its effect redundantly on every normal page load, not just on an actual facade change. A dedicated, coarser event fired exactly once per `AccessStore.setFacade` call is a cleaner signal for pages to subscribe to.

Confirmed not in scope: the underlying content endpoints (`/games/:slug.json`, character/treasure detail and list endpoints) never accepted a `role` param in the first place — only the `*Permissions` endpoints do (see `GameClient#fetchGamePermissions`, `CharacterClient#fetchCharacterPermissions`, `TreasureClient#fetchTreasurePermissions`, all via `buildRoleQuery`). So "how that role would see it" is, and stays, scoped to the existing `*Access`/`*Permissions` overlay (e.g. `can_edit`) merged onto content already fetched under the real user's identity — this plan does not add role-awareness to content-fetch clients.

## Implementation Steps

### Step 1 — Add a dedicated "facade changed" signal

In `frontend/assets/js/utils/access/AccessEvents.js`, add a second event channel (mirroring the existing `emit`/`subscribe`/`unsubscribe` for `access:changed`), e.g. `ACCESS_FACADE_CHANGED_EVENT = 'access:facade-changed'` with `emitFacadeChanged()`, `subscribeFacadeChanged(handler)`, `unsubscribeFacadeChanged(handler)`. Keep it separate from the generic per-key `access:changed` channel so subscribers aren't triggered by ordinary first-load access/permission resolutions.

### Step 2 — Emit it from `AccessStore.setFacade`

In `frontend/assets/js/utils/access/store/AccessStore.js#setFacade`, call `AccessEvents.emitFacadeChanged()` once, after triggering `reset()`/`syncForRoute()`. Update the method's JSDoc to mention the new signal. Do **not** emit it from `syncForAuthChange` (login/logout) — that path already re-syncs the route directly and firing the facade signal there is unrelated and unnecessary.

### Step 3 — Add a small reusable subscription hook

Add a page-level React hook (e.g. `frontend/assets/js/utils/access/useFacadeRefresh.js`, or alongside other shared page hooks if a more fitting location exists) that, given a `controller` exposing `buildEffect()`, subscribes to `subscribeFacadeChanged` on mount and re-invokes `controller.buildEffect()()` when it fires, unsubscribing on unmount. This keeps each page's own change to a single added line rather than duplicating subscribe/unsubscribe boilerplate 15 times.

### Step 4 — Wire the hook into affected pages

Add the new hook's call (alongside the existing `useEffect(() => controller.buildEffect()(), [controller])`) to every page component whose controller consumes `AccessStore` access/permissions:

- `Game.jsx` (`GameController`)
- `GameNpcs.jsx` (`GameNpcsController`)
- `GamePhotos.jsx` (`GamePhotosController`)
- `GameTasks.jsx` (`GameTasksController`)
- `GameTreasures.jsx` (`GameTreasuresController`)
- `GameSessions.jsx` (`GameSessionsController`)
- `Treasure.jsx` (`TreasureController`)
- `shared/CharacterDetail.jsx` (`CharacterController`, used by both PC and NPC detail pages)
- `shared/CharacterPhotos.jsx` (`BaseCharacterPhotosController`)
- `shared/CharacterTreasures.jsx` (`BaseCharacterTreasuresController`)

See the Notes section below regarding the New/Edit-page controllers (`GameEditController`, `TreasureEditController`, `GameSessionNewController`, `GameNpcNewController`, `GameTreasureNewController`) — do not wire these without first resolving the open question about in-progress form data.

### Step 5 — Tests

- `frontend/specs/utils/access/AccessEvents.spec.js` — cover the new `emitFacadeChanged`/`subscribeFacadeChanged`/`unsubscribeFacadeChanged` trio.
- `frontend/specs/utils/access/store/AccessStore.spec.js` — assert `setFacade` calls `AccessEvents.emitFacadeChanged()` once.
- A new spec for the hook added in Step 3.
- For each page updated in Step 4, extend its existing spec to assert that saving a facade change (simulated by invoking the subscribed handler, or by calling `AccessStore.setFacade` directly in the spec) causes the controller's effect to run again.

## Files to Change

- `frontend/assets/js/utils/access/AccessEvents.js` — add the `access:facade-changed` event channel.
- `frontend/assets/js/utils/access/store/AccessStore.js` — emit it from `setFacade`.
- `frontend/assets/js/utils/access/useFacadeRefresh.js` (new) — shared subscribe/re-run hook.
- `frontend/assets/js/components/resources/game/pages/Game.jsx`
- `frontend/assets/js/components/resources/character/pages/GameNpcs.jsx`
- `frontend/assets/js/components/resources/game/pages/GamePhotos.jsx`
- `frontend/assets/js/components/resources/game/pages/GameTasks.jsx`
- `frontend/assets/js/components/resources/treasure/pages/GameTreasures.jsx`
- `frontend/assets/js/components/resources/game_session/pages/GameSessions.jsx`
- `frontend/assets/js/components/resources/treasure/pages/Treasure.jsx`
- `frontend/assets/js/components/resources/character/pages/shared/CharacterDetail.jsx`
- `frontend/assets/js/components/resources/character/pages/shared/CharacterPhotos.jsx`
- `frontend/assets/js/components/resources/character/pages/shared/CharacterTreasures.jsx`
- Corresponding spec files under `frontend/specs/` for every file above (mirrors `assets/js/`).

## Notes

- **Open question — Edit/New pages**: `GameEditController`, `TreasureEditController`, `GameSessionNewController`, `GameNpcNewController`, and `GameTreasureNewController` also consume `AccessStore` access/permissions, but blindly re-running their `buildEffect()` on a facade change would re-fetch and could discard in-progress form input. Since reaching an edit page already requires `can_edit`, simulating a lower-privileged role there arguably should revoke access (e.g. redirect/show an error) rather than silently reload the form. Recommend the frontend agent decide between: (a) excluding these controllers from the refresh subscription entirely, or (b) wiring a narrower "access revoked" reaction instead of a full effect re-run. Flagging rather than prescribing, since this is a product/UX judgment call.
- No backend changes are needed — the facade mechanism is already fully frontend-driven and stateless server-side (`backend/games/views/common.py#parse_role_booleans`).
- This does not introduce `window.location.reload()` anywhere, per the discussion on issue #465 — it stays consistent with the existing in-place refetch pattern the codebase already uses for `*Permissions`.
