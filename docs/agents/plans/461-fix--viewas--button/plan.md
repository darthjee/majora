# Plan: Fix "ViewAs" button

Issue: [461-fix--viewas--button.md](../issues/461-fix--viewas--button.md)

## Overview

The "ViewAs" button, its icon, and `ViewAsModal` are already fully implemented and correctly wired in the header. The bug is that `Header.jsx` only computes `isSuperUser`/`isStaff`/`canViewAs` once, in its mount `useEffect`. Logging in through the in-app `LoginModal` (no page reload) emits `auth:changed`, but the header's existing handler for that event only updates `loggedIn` — it never re-runs the status/availability checks, so admin-only header state (ViewAs button, and any other control gated on `isSuperUser`/`isStaff`) stays stuck at its pre-login value until a full reload. The fix makes the header re-run `HeaderController#checkStatus()` and `HeaderViewAsController#checkAvailability()` when `auth:changed` reports a genuine login transition.

## Context

See the issue's "Root cause" section for the full trace. Key files:

- `frontend/assets/js/components/elements/Header.jsx` — owns the `useEffect` that runs the checks once at mount and subscribes to `AuthEvents` via `handleAuthChanged` (currently only calls `setLoggedIn`).
- `frontend/assets/js/components/elements/controllers/HeaderController.js` — `checkStatus()` (line ~165) fetches `/users/status.json`, sets `isSuperUser`/`isStaff`/`loggedIn`, and **itself calls `AuthEvents.emit(...)`** on success (line 182).
- `frontend/assets/js/components/elements/controllers/HeaderViewAsController.js` — `checkAvailability()` fetches the real admin/staff check via `AccessStore.isReallyAdminOrStaff()` and sets `canViewAs`. Does not emit any event.
- `frontend/assets/js/components/elements/controllers/LoginModalController.js` — `#handleSuccess()` (line ~117) calls `AuthEvents.emit(true)` directly on a successful in-app login.
- `frontend/assets/js/utils/AuthEvents.js` — thin `window` CustomEvent wrapper (`emit`/`subscribe`/`unsubscribe`) for `auth:changed`.

### Important pitfall: avoid an emit/handler feedback loop

`checkStatus()` calls `AuthEvents.emit(...)` on every successful completion. If the `auth:changed` handler in `Header.jsx` naively calls `checkStatus()` again, that creates an infinite loop: `emit → handler → checkStatus() → emit → handler → ...` (an unbounded stream of `/users/status.json` requests, not just a one-time double-check).

The handler must only re-run the checks on a genuine transition, not on every emit — e.g. keep a ref holding the last-handled `loggedIn` value, and only call `checkStatus()`/`checkAvailability()` when the incoming event's `loggedIn` differs from that ref, updating the ref before/alongside the calls. Since `checkStatus()`'s own resulting emit carries the same `loggedIn` value just recorded, the next invocation of the handler will see no change and stop the chain after one extra round-trip.

## Implementation Steps

### Step 1 — Track the last-handled auth state in `Header.jsx`

Add a `useRef` (e.g. `lastLoggedInRef`) initialized to the current `loggedIn` state, to record the most recent `loggedIn` value the header has already reacted to.

### Step 2 — Re-run the checks on a genuine auth transition

In the `handleAuthChanged` callback inside the mount `useEffect`:
- Read the new `loggedIn` value from `event.detail?.loggedIn`.
- Always call `setLoggedIn(...)` as today.
- Only when the new value differs from `lastLoggedInRef.current`: update the ref to the new value, then call `controller.checkStatus()` and `viewAsController.checkAvailability()` again, so `isSuperUser`, `isStaff`, and `canViewAs` are recomputed against the now-current token in `AuthStorage`.

This covers both directions: logging in via the modal (false → true) refreshes admin/staff/ViewAs state from the newly authenticated session, and logging out (true → false) refreshes it back down without a stale "admin" flag lingering.

### Step 3 — Verify no other admin-gated header control is missed

Confirm (via `HeaderHelper.jsx`) which other nav links/controls are gated on `isSuperUser`/`isStaff` (e.g. Treasures, Staff-Users links) and confirm they read the same `Header.jsx` state values touched in Step 2 — no separate wiring should be needed for them, since they consume the same state re-computed by `checkStatus()`.

### Step 4 — Tests

Update/add specs to cover the new behavior:
- `frontend/specs/assets/js/components/elements/HeaderSpec.js` — assert that dispatching `auth:changed` with a `loggedIn` value different from the current one triggers a fresh `checkStatus()`/`checkAvailability()` call (e.g. via injected controller/client mocks), and that dispatching it again with the *same* value does not trigger another round (guards against the feedback loop regressing).
- `frontend/specs/assets/js/components/elements/controllers/HeaderViewAsControllerSpec.js` — no change expected unless `checkAvailability()`'s call surface changes.

## Files to Change

- `frontend/assets/js/components/elements/Header.jsx` — add the last-logged-in ref and update `handleAuthChanged` to conditionally re-run `checkStatus()`/`checkAvailability()`.
- `frontend/specs/assets/js/components/elements/HeaderSpec.js` — add coverage for the re-check-on-transition behavior and the no-loop guard.

## CI Checks

- `frontend`: `docker-compose run --rm majora_fe yarn lint` (CI job: `frontend-checks`)
- `frontend`: `docker-compose run --rm majora_fe yarn coverage` (CI job: `jasmine`)

## Notes

- Do not touch the currently-unused `AccessEvents`/`access:changed` event — the issue explicitly scoped that out as a potential follow-up, not part of this fix.
- `handleLogoffClick()` in `HeaderController.js` already emits `AuthEvents.emit(false)` directly (not via `checkStatus()`), so the Step 2 guard must trigger correctly off that emit too, not just off `checkStatus()`'s own emit.
- Keep the guard logic simple (a single ref comparison) — no need for a full state machine.
