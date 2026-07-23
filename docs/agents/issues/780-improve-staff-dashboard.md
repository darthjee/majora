# Issue: Improve staff dashboard

## Description
Rebuild the staff dashboard page at `/#/staff/dashboard` as a collection of cards, in the same visual family as the existing games index (`/#/games`), npcs index (`/#/games/game_slug/npcs`), and pc items index (`/#/games/game_slug/pcs/:id/items`) pages, but with a dedicated card component suited to this page's needs. Unlike those pages, the card collection here is not sourced from an API endpoint but from a local configuration file that lists which components to render. Only one card is being added for now: `memory_cache`.

## Problem
`/#/staff/dashboard` already exists (`StaffDashboard.jsx`/`StaffDashboardHelper.jsx`/`StaffDashboardController.js`), but today it renders a single bare "Clear Cache" button with no title and no data displayed — staff have to clear the cache without knowing whether it's actually near its limit. It also doesn't follow the card-grid pattern used elsewhere in the app, and, notably, it is currently unreachable from the UI: the header's "Admin" dropdown has no menu item linking to it.

## Expected Behavior
- Admin/staff users see a "Dashboard" item in the header's "Admin" dropdown, linking to `/#/staff/dashboard`.
- The dashboard page shows a grid of cards (4 per row), driven by a local configuration file rather than an endpoint.
- The only card for now is `memory_cache`, showing the current cache usage as a percentage (which can exceed 100%), with "Clear Cache" and "Refresh" actions. This replaces today's bare button.
- Clicking the data part of a card logs the card's raw data to the console at debug level, regardless of the build-time log level configured for `MajoraLogger`.
- Non admin/staff users cannot see the menu item, cannot load the page, and cannot call the underlying endpoints.

## Solution

### Layout
- 4 cards per row.
- A new, dedicated card component for this page (the existing generic `ListPage`/`listTypeConfig` machinery used by games/npcs/items is built for paginated resource lists and is not a fit here).
- The collection comes from a local configuration file, not an endpoint. For now it only lists the `memory_cache` component/configuration.

### Card layout
Same general layout as games/npcs/items cards, adapted:
- Top part: title + data (instead of a photo).
- Bottom part: actions (instead of descriptive text).
- The card is not a link to another page.
- Each component may render its data differently (graph, percentage, text, etc.).
- Clicking the data part logs the raw data to the console as `debug`, via a direct `console.debug` call, not through `MajoraLogger`. This is a deliberate, confirmed exception to the codebase's convention that `MajoraLogger` is the only sanctioned console entry point (its build-time-gated `debug`/`info`/`warn`/`error` wrappers are used everywhere else, including the current staff dashboard's own logging): this particular log must always fire regardless of the configured build-time level.

### Components
- The card component itself (receives what to render internally).
- A dedicated `CardTop` component for the title + data slot, reused by every future card type (not just memory_cache).
- A dedicated `CardActions` component for the bottom part, laying out a row of buttons from configs supplied by each card type.
- A button component for the actions part.
- Data-display components, starting with a percentage component.

#### Percentage display component
Receives `value`, `limit`, and `thresholds`; internally computes `percentage = value / limit`. Thresholds define the color:
- up to 0.5 (50%): green (ok)
- above 0.5 up to 0.8 (80%): yellow (warning)
- above 0.8 up to 1.0 (100%): red (danger)
- above 1.0: purple (overlimit)

Colors are hardcoded via CSS classes (no configurable colors for now).

`thresholds` normalization (on component initialization, before evaluating percentage):
1. `null`/`undefined` becomes `[]`.
2. Sort the array.
3. Apply these rules:
   - Empty (`[]`): default to `[0.5, 0.8, 1.0]`.
   - Single value:
     - below `1` (e.g. `[0.7]`): `[0.7, 0.7, 1.0]` (never shows yellow).
     - `>= 1` (e.g. `[1.2]`): `[1.2, 1.2, 1.2]` (never shows yellow or red).
   - Two values:
     - second value `< 1` (e.g. `[0.7, 0.8]`): append `1.0`, resulting in `[0.7, 0.8, 1.0]`.
     - second value `>= 1`, first `< 1` (e.g. `[0.7, 1.2]`): duplicate first, resulting in `[0.7, 0.7, 1.2]`.
     - both values `>= 1` (e.g. `[1.2, 1.3]`): duplicate first, resulting in `[1.2, 1.2, 1.3]`.

This threshold-normalization logic should live in a dedicated class used by the component, to keep the component itself simple.

### memory_cache component
The only card for now. Replaces the current dashboard's bare "Clear Cache" button entirely.

- Title: "Memory Cache"
- Data source: `GET /staff/cache/summary.json`
- Data display: percentage of memory cache in use (using the percentage component above, with default thresholds), which can exceed 100%.
- Actions:
  - "Clear Cache" button, bootstrap icon `database-fill-dash` (already centralized in `Icons.js` as `databaseFillDash`), text shown as a hover tooltip (matching the existing `CardHoverTooltip` pattern). Sends `DELETE /staff/cache.json`, then refreshes the data part.
  - "Refresh" button, bootstrap icon `database-fill-dash`, text shown as a hover tooltip. Refreshes the data part.

### Endpoints
- Already exists: `DELETE /staff/cache.json` (`backend/games/views/staff/staff_cache_clear.py`).
- New: `GET /staff/cache/summary.json`, following the same staff-endpoint pattern (`AllowAny` + inline `require_staff` check, `X-Skip-Cache: true` response header).
  - Reads `_total_size_bytes` from `MemoryCache` (`backend/majora_project/cache/base.py`) as `size`, and `Settings.max_size_bytes()` (`backend/majora_project/cache/settings.py`) as `limit`. `MemoryCache` currently has no public accessor for `_total_size_bytes`; a new read method (e.g. `summary()`) is needed since it's private-by-convention.
  - Response: size in bytes and limit in bytes.

### Header menu
Add a "Dashboard" menu item (labeled "Dashboard" in Portuguese too) under the "Admin" dropdown in the header (`HeaderNavHelper.renderAdminNavLinks`), linking to `/#/staff/dashboard`, alongside the existing "Treasures" and "Staff Users" items. New i18n key `header.nav_staff_dashboard` in both `en.yaml` and `pt.yaml`.

### Permissions
Access to the menu item, the page, and the new endpoint is restricted to admin or staff users only - reusing the existing `AccessStore.ensureStaffOrSuperUser()` frontend guard (already used by `StaffDashboardController`) and the `require_staff` backend check (already used by the existing cache-clear endpoint).

## Benefits
- Gives staff/admins a single, discoverable place (linked from the header) to monitor and act on system-level operational data, starting with memory cache usage.
- The configuration-driven card list makes it straightforward to add more monitoring/management widgets later without new page-level code.
- The percentage component and its threshold-normalization logic are reusable for any future metric that needs color-coded status.
