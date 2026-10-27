# Write dashboard-card.md

Create `docs/agents/specs/statistics_dashboard/dashboard-card.md` using the common template.
Implemented by #1685.

- **Purpose:** the staff dashboard card for the visits summary.
- **Contract:**
  - A new entry in `dashboardCardConfig.js`. The card reuses `DashboardCard` / `CardActions`
    and follows the `MemoryCacheCard` patterns (controller, helper, confirmation modal).
  - States: `loading`, `error`, `idle` / `success` / `error` action status.
  - Calls: `GET staff/statistics/summary.json?period&tz` and `DELETE staff/statistics.json`
    (payloads as in the endpoint pages).
  - `tz` comes from `Intl.DateTimeFormat().resolvedOptions().timeZone`.
- **Behaviour:**
  - The period select (`day` / `week` / `month`, default `day`); changing it fetches again.
  - Reload fetches again.
  - Clear opens a modal whose confirm button is enabled only when the input equals `CLEAR`:
    not translated, case-sensitive, surrounding whitespace trimmed. Cancelling clears the input.
  - On success: a success status showing the deleted counts, then the count is fetched again.
  - On failure: an error status, then the count is fetched again anyway.
  - A link to `/#/staff/statistics`.
  - New i18n keys for every supported language.
- **Permissions & caching:**
  - The route is already gated by `staffOrSuperuser` (`accessRouteConfig.js`), plus
    `AccessStore.ensureStaffOrSuperUser()`.
  - Both calls go through `RequestStore`: add `GET.summary` and a `DELETE` entry to
    `staffStatisticsConfig.js` with `permission: null` (`regular` and `private` point to the
    same object). There is **no** `RequestPermissionResolvers.js` entry (`NO_PERMISSIONS`).
  - The clear uses `RequestStore.mutate`. There is no dedicated client like `StaffCacheClient`.
  - The Clear button is visible to everyone who sees the card. A `403` is shown as the error
    state.
- **Edge cases:**
  - Controls are disabled while any request is in flight, so a stale response cannot win.
  - A period with no data shows `0`.
  - If the browser has no `tz`, the parameter is omitted (the server uses UTC).
  - A `403` is shown as an error.
- **Tests (Jasmine):**
  - rendering, period change, Reload;
  - the typed-confirmation flow (wrong text, exact text, whitespace, cancel);
  - post-clear reload on success and on failure;
  - the loading, error and disabled states.
  - ESLint passes, and the translation keys are in sync.
- **Open questions:** none.
- **Implemented by:** #1685. It builds against the contracts; the end-to-end check needs #1682
  and #1684.

## Files to Change

- `docs/agents/specs/statistics_dashboard/dashboard-card.md` — new topic page.
