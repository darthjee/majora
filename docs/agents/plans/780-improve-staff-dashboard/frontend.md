# Frontend Plan: Improve staff dashboard

Main plan: [plan.md](plan.md)

## Shared contracts

- Consumes `GET /staff/cache/summary.json` -> `{ "size": <int>, "limit": <int> }`
  (see [backend.md](backend.md)), and the existing `DELETE /staff/cache.json`
  (no body).
- Consumes new i18n keys listed in [translator.md](translator.md) via
  `Translator.t()`; do not hardcode English/Portuguese strings.
- `/#/staff/dashboard` routing and access-gating (`AccessStore.ensureStaffOrSuperUser()`)
  are unchanged — only the page's rendered content and the header link change.

## Implementation Steps

### Step 1 — `StaffCacheClient.fetchSummary`

Add a `fetchSummary(token)` method to `frontend/assets/js/client/StaffCacheClient.js`,
alongside the existing `clearCache`, calling `this.getJson('/staff/cache/summary.json', token)`
(see `BaseClient.getJson`).

### Step 2 — Percentage display elements (resource-specific, reusable by future dashboard cards)

All new elements below are specific to the `staff_dashboard` resource for now (only
this page uses them), so they live under
`frontend/assets/js/components/resources/staff_dashboard/pages/elements/` per the
"Pages vs Elements" convention in `docs/agents/frontend.md` — not under `common/`,
since nothing outside this resource imports them yet.

- **`PercentageThresholds.js`** (plain JS class, no JSX) — the threshold
  normalization/level logic from the issue's "Display of percentage component"
  section:
  - `static normalize(thresholds)`: `null`/`undefined` -> `[]`; sort ascending;
    then apply the empty/single-value/two-value rules from the issue verbatim
    (already restated precisely in
    `docs/agents/issues/780-improve-staff-dashboard.md`'s Solution section) to
    produce a 3-element `[warnMax, dangerMax, overlimitMax]` array.
  - `static levelFor(percentage, thresholds)`: normalizes `thresholds`, then
    returns `'ok'` when `percentage <= warnMax`, `'warning'` when
    `<= dangerMax`, `'danger'` when `<= overlimitMax`, else `'overlimit'`.
  - Both methods are `static` — no instance state needed.

- **`PercentageDisplay.jsx`** — props `{ value, limit, thresholds }`. Computes
  `percentage = limit > 0 ? value / limit : 0`, resolves the level via
  `PercentageThresholds.levelFor`, and renders the formatted percentage
  (`Math.round(percentage * 100)}%`) in a `<span>` with a level -> CSS class
  mapping: `ok` -> `text-success`, `warning` -> `text-warning`, `danger` ->
  `text-danger`, `overlimit` -> a new `text-overlimit` class. Bootstrap has no
  built-in "purple" text utility, so add `.text-overlimit { color: #6f42c1; }`
  (Bootstrap's own `$purple` swatch value) to `frontend/assets/css/main.scss`.

### Step 3 — Card layout elements (shared by every dashboard card, current and future)

Also under `resources/staff_dashboard/pages/elements/`:

- **`DashboardCard.jsx`** — the outer card shell (a bootstrap `card` div, `h-100`),
  taking `top` and `actions` as children/props and composing them (no card is a
  link, unlike `ListPageHelper`'s items — no wrapping `<a>`).
- **`CardTop.jsx`** — props `{ title, data, onDataClick }` (or `children` for
  `data`, whichever reads cleaner given `PercentageDisplay`'s output). Renders
  the title and the data slot; wraps the data slot in a `<button>`/clickable
  element whose `onClick` calls `onDataClick` (see Step 4 for what that logs).
- **`CardActions.jsx`** — props `{ actions }`, where each action is
  `{ icon, tooltip, onClick, disabled }`. Renders one button per action, each
  wrapped in `CardHoverTooltip` (`common/cards/CardHoverTooltip.jsx`) exactly like
  today's single clear-cache button, laid out in a row (e.g. `d-flex
  justify-content-center gap-2`).

### Step 4 — `memory_cache` card

- **`MemoryCacheCardController.js`** (plain class, not extending
  `BasePageController` — same precedent as other element controllers, e.g.
  `resources/game/pages/elements/controllers/OpenPollsWidgetController.js`):
  - Constructor takes state setters (`setSummary`, `setStatus`, `setLoading`,
    `setError`) and an optional `StaffCacheClient` override.
  - `buildEffect()`: fetches the summary on mount (same
    `buildSafeSetter`-guarded-unmount pattern the page controller already uses),
    setting `loading`/`error`/`summary`.
  - `refresh()`: re-fetches the summary, updating `summary`/`status`.
  - `clearCache()`: calls `client.clearCache(token)` (existing method), then
    calls `refresh()` on success — matches the issue's "refresh data part after
    DELETE is complete".
  - `logData()`: `console.debug(summary)` directly (not via `MajoraLogger` —
    confirmed deliberate exception, see [plan.md](plan.md)'s Notes). Add
    `// eslint-disable-next-line no-console -- deliberate exception, see issue #780`
    since ESLint's `no-console` rule (`frontend/eslint.config.mjs`) only allows
    `warn`/`error` by default.
- **`MemoryCacheCard.jsx`** — state + effect only (per the Component/Controller/
  Helper split): instantiates `MemoryCacheCardController`, wires its effect,
  renders loading/error states, otherwise composes `DashboardCard` >
  `CardTop` (title = `Translator.t('staff_dashboard.memory_cache_title')`, data =
  `<PercentageDisplay value={summary.size} limit={summary.limit}
  thresholds={undefined} />` — default thresholds per the issue, `onDataClick`
  = `controller.logData`) + `CardActions` with two entries: Clear Cache
  (`Icons.databaseFillDash`, `staff_dashboard.clear_cache_tooltip`,
  `controller.clearCache`) and Refresh (`Icons.databaseFillDash`,
  `staff_dashboard.refresh_tooltip`, `controller.refresh`). Keeps rendering the
  existing success/error feedback text below the card
  (`staff_dashboard.clear_cache_success`/`clear_cache_error`, plus a new
  `staff_dashboard.summary_load_error` for a failed summary fetch).
- A `MemoryCacheCardHelper.jsx` is only needed if `MemoryCacheCard.jsx`'s render
  logic grows past a simple composition — start without one and extract per the
  usual extraction rules if it does.

### Step 5 — Local dashboard card configuration

Add `frontend/assets/js/components/resources/staff_dashboard/pages/dashboardCardConfig.js`,
the "local configuration file" the issue calls for — a plain array (not fetched
from an endpoint):

```js
import MemoryCacheCard from './elements/MemoryCacheCard.jsx';

export default [
  { key: 'memory_cache', Component: MemoryCacheCard },
];
```

### Step 6 — Rewrite the dashboard page

- **`StaffDashboardController.js`**: drop `clearCache` (moved to
  `MemoryCacheCardController`) — keep only the access-gating `buildEffect()`.
- **`StaffDashboardHelper.jsx`**: replace the single hardcoded button card with a
  `row` that maps over `dashboardCardConfig`, rendering each entry's `Component`
  inside a `col-6 col-sm-4 col-md-3 col-lg-3 mb-4` cell — the same column classes
  `ListPageHelper.#largeColumnClass` produces for `itemsPerRow: 4`, keeping the
  4-per-row grid consistent with the games/npcs/items index pages the issue
  references. Drop the now-unused `status`/`onClearCache` prop plumbing from
  `StaffDashboard.jsx` (each card now owns its own status/actions internally via
  its own controller).

### Step 7 — Header nav link

Edit `HeaderNavHelper.renderAdminNavLinks`
(`frontend/assets/js/components/common/header/helpers/HeaderNavHelper.jsx`): add
`<NavDropdown.Item href="#/staff/dashboard">{Translator.t('header.nav_staff_dashboard')}</NavDropdown.Item>`
after the existing "Staff Users" item.

### Step 8 — Tests

Mirror every new/changed source file under `frontend/specs/`, following the
existing per-method controller-spec-folder convention already used for
`StaffDashboardController` (`specs/.../controllers/StaffDashboardController/{buildEffectSpec,clearCacheSpec,support}.js`):

- `PercentageThresholdsSpec.js` — table-test every example from the issue's
  Solution section (empty, single below/above 1, two-value variants) plus
  `levelFor` boundary cases (exactly at each cutoff).
- `PercentageDisplaySpec.js` — renders the right percentage text and CSS class
  per level, including the `limit === 0` edge case.
- `DashboardCardSpec.js`, `CardTopSpec.js` (including the `onDataClick` wiring),
  `CardActionsSpec.js` (including `disabled` state).
- `MemoryCacheCardController/` — `buildEffectSpec.js`, `refreshSpec.js`,
  `clearCacheSpec.js`, `logDataSpec.js`, `support.js`.
- `MemoryCacheCardSpec.js` — loading/error/success render states.
- Update `StaffDashboardControllerSpec`/`StaffDashboardHelperSpec` for the
  dropped `clearCache`/status plumbing and the new config-driven grid.
- `HeaderNavHelperSpec.js` — assert the new "Dashboard" item renders for
  staff/superuser state (existing spec already covers the admin-dropdown gating).
- `StaffCacheClientSpec.js` — `fetchSummary` request shape.

## Files to Change

- `frontend/assets/js/client/StaffCacheClient.js` — add `fetchSummary`
- `frontend/assets/js/components/resources/staff_dashboard/pages/elements/PercentageThresholds.js` — new
- `frontend/assets/js/components/resources/staff_dashboard/pages/elements/PercentageDisplay.jsx` — new
- `frontend/assets/js/components/resources/staff_dashboard/pages/elements/DashboardCard.jsx` — new
- `frontend/assets/js/components/resources/staff_dashboard/pages/elements/CardTop.jsx` — new
- `frontend/assets/js/components/resources/staff_dashboard/pages/elements/CardActions.jsx` — new
- `frontend/assets/js/components/resources/staff_dashboard/pages/elements/MemoryCacheCard.jsx` — new
- `frontend/assets/js/components/resources/staff_dashboard/pages/elements/controllers/MemoryCacheCardController.js` — new
- `frontend/assets/js/components/resources/staff_dashboard/pages/dashboardCardConfig.js` — new
- `frontend/assets/js/components/resources/staff_dashboard/pages/StaffDashboard.jsx` — simplify
- `frontend/assets/js/components/resources/staff_dashboard/pages/controllers/StaffDashboardController.js` — drop clearCache
- `frontend/assets/js/components/resources/staff_dashboard/pages/helpers/StaffDashboardHelper.jsx` — config-driven grid
- `frontend/assets/js/components/common/header/helpers/HeaderNavHelper.jsx` — add nav item
- `frontend/assets/css/main.scss` — `.text-overlimit`
- `frontend/specs/...` — new/updated specs for every file above (see Step 8)

## CI Checks

- `docker-compose run --rm majora_fe yarn test` (CI job: `jasmine`)
- `docker-compose run --rm majora_fe yarn lint` (CI job: `frontend-checks`)

## Notes

- Wait for [translator.md](translator.md)'s new keys before wiring
  `Translator.t()` calls that reference them, to avoid a temporary
  `check_i18n` failure — or add them together in the same change if one agent
  ends up doing both.
