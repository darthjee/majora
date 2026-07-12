# Issue: Fix "ViewAs" button

## Description
Admins, superusers, and staff should be able to switch which role(s) they view the app as via a "ViewAs" button in the header, next to the "My account" link.

## Problem
The "ViewAs" button never appears in the header for admin/superuser/staff users who log in through the in-app login modal (the normal SPA login flow, without a full page reload).

### Root cause
The button, its icon (`bi-file-person-fill` via `Icons.viewAs`), and the `ViewAsModal` it opens are all fully implemented and correctly wired end-to-end:

- `HeaderHelper.jsx` (`#renderViewAsLink`, ~line 211-228) renders the button right after the "My account" link, gated on `state.canViewAs`.
- `Header.jsx` renders `<ViewAsModal>` and toggles it via `HeaderViewAsController`.

The actual bug is that `canViewAs` (and `isSuperUser`/`isStaff`) are computed **once**, in `Header.jsx`'s mount `useEffect` (empty dependency array), by calling `HeaderViewAsController.checkAvailability()` → `AccessStoreAdmin.ensureStaffOrSuperUser()` → `AuthClient.status()` (`/users/status.json`).

When a user logs in via `LoginModal` without a page reload, `LoginModalController#handleSuccess` emits `AuthEvents` (`auth:changed`). That event is handled in two places, neither of which re-checks admin/staff/ViewAs availability:

- `Header.jsx`'s `handleAuthChanged` only updates `loggedIn` state — it never re-runs `checkStatus()` or `checkAvailability()`.
- `AppController.js` → `AccessStore.syncForAuthChange()` resets the access cache but only re-fetches **route-scoped** descriptors from `accessRouteConfig`; the standalone `'admin:staff'` cache key used for `canViewAs`/`isSuperUser`/`isStaff` is not part of that config, so it is never refreshed.

Separately, `AccessCache` emits an `AccessEvents` (`access:changed`) event every time a cached key settles — seemingly designed for exactly this "react without polling" use case — but nothing in the frontend subscribes to it. This is left as-is for now (out of scope for this fix).

Net effect: `canViewAs`/`isSuperUser`/`isStaff` stay stuck at their pre-login (`false`) values after an in-app login, so the ViewAs button **and every other admin/staff-only header control** (e.g. Treasures and Staff-Users nav links, which read the same `isSuperUser`/`isStaff` state) only appear correctly after a full page reload, which remounts `Header` and re-runs the status/availability checks fresh with the now-authenticated session.

## Expected Behavior
- The "ViewAs" button (icon `bi-file-person-fill`) is shown in the header, next to the "My account" link, for any user who is currently an admin (superuser) or staff — regardless of whether they are currently viewing the app as another role.
- All other admin/staff-only header controls (e.g. Treasures and Staff-Users nav links) likewise reflect the correct role immediately.
- This becomes correct immediately after logging in through the in-app login modal, with no full page reload required.
- Clicking the ViewAs button opens the existing `ViewAsModal`.

## Solution
On `auth:changed`, have `Header.jsx` (or `HeaderViewAsController`/`HeaderController`) re-run `checkStatus()` and `checkAvailability()` so `isSuperUser`, `isStaff`, and `canViewAs` are recomputed against the freshly authenticated session, instead of only being computed once at mount. This is a targeted fix scoped to the existing `auth:changed` handling path; it does not touch the currently-unused `access:changed` event (left as-is, potential follow-up).

## Benefits
- Admin/staff/superuser users get correct access to the ViewAs feature — and all other admin-only header controls — immediately after logging in, without needing to reload the page.
