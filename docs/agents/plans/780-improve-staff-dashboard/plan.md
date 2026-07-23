# Plan: Improve staff dashboard

Issue: [780-improve-staff-dashboard.md](../../issues/780-improve-staff-dashboard.md)

## Overview

`/#/staff/dashboard` already exists but only renders a single bare "Clear Cache"
button (no title, no data) and isn't linked from anywhere in the UI. This rebuilds
it into a config-driven grid of cards (4 per row, reusing the same column classes
`ListPageHelper` already uses for `itemsPerRow: 4`), replacing the bare button
entirely. The only card for now is `memory_cache`, showing current cache usage as
a color-coded percentage (via a new, reusable `PercentageDisplay` element backed by
a `PercentageThresholds` normalization class) plus "Clear Cache" and "Refresh"
actions, backed by a new `GET /staff/cache/summary.json` endpoint. New shared card
elements (`DashboardCard`, `CardTop`, `CardActions`) are introduced so future card
types can be added purely by extending the local `dashboardCardConfig.js` file. A
"Dashboard" link is added to the header's "Admin" dropdown. New translation keys
are added for the header link and the new card content.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)
- [translator](translator.md)

## Shared contracts

### New endpoint (backend produces, frontend consumes)

`GET /staff/cache/summary.json`

- Same access pattern as the existing `DELETE /staff/cache.json`:
  `CookieTokenAuthentication`, `AllowAny` + inline `require_staff` check
  (401 unauthenticated, 403 non-staff/non-superuser), response header
  `X-Skip-Cache: true`.
- Response body (200):
  ```json
  { "size": 1048576, "limit": 10485760 }
  ```
  `size`/`limit` are both integers, in bytes. `size` comes from
  `MemoryCache._total_size_bytes`, `limit` from `Settings.max_size_bytes()`
  (both in `backend/majora_project/cache/`), via a new `MemoryCache.summary()`
  method (see [backend.md](backend.md)).

### Frontend route (unchanged, just confirming the contract)

`/#/staff/dashboard` is already registered (`HashRouteResolver.js` page key
`staffDashboard`, wired in `AppHelper.jsx`) and already gated by
`AccessStore.ensureStaffOrSuperUser()` in `StaffDashboardController`. No routing
changes are needed — only the page's rendered content and its header link.

### Header nav (frontend produces the link, translator produces the label)

A third `<NavDropdown.Item href="#/staff/dashboard">` is added to
`HeaderNavHelper.renderAdminNavLinks` (`frontend/assets/js/components/common/header/helpers/HeaderNavHelper.jsx`),
alongside the existing "Treasures" and "Staff Users" items, labeled via a new
i18n key `header.nav_staff_dashboard`.

### Translation keys (translator produces, frontend consumes via `Translator.t()`)

- `header.nav_staff_dashboard` — the new Admin-dropdown menu label.
- New keys under the existing `staff_dashboard:` namespace for the memory_cache
  card's title and the refresh action's tooltip, and an error message for a
  failed summary fetch. Exact key names and English/Portuguese copy are listed in
  [translator.md](translator.md); the existing `staff_dashboard.title`,
  `staff_dashboard.loading`, `staff_dashboard.clear_cache_tooltip`,
  `staff_dashboard.clear_cache_success`, and `staff_dashboard.clear_cache_error`
  keys are reused as-is.

## Notes

- No product-concept or ownership-chain change: per `docs/agents/product.md`'s
  "Staff Role" section, Staff already has full parity with Superuser on any
  non-game-scoped endpoint, which this new endpoint follows exactly (same
  `require_staff` gate as the existing cache-clear endpoint) — no
  `product-owner` consult was needed beyond confirming this precedent.
- `security` and `data-access` review should be invoked once this is
  implemented, since a new staff-only read endpoint is added (same precedent
  as other new-endpoint issues).
- The raw `console.debug` call on card-data click (bypassing `MajoraLogger`,
  the codebase's only other sanctioned console entry point) is a deliberate,
  confirmed exception — see the issue file's Solution section for why.
