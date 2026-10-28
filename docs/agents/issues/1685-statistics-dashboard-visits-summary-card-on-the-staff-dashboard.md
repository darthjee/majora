# Issue: Statistics dashboard: visits summary card on the staff dashboard

## Description

Part of #1678 (Epic: staff dashboard visits summary card).

Add the **visits summary card** to the staff dashboard (`/#/staff/dashboard`), implementing
`docs/agents/specs/statistics_dashboard/dashboard-card.md`. The backend endpoints it calls are
already merged: the count endpoint (#1682) and the clear endpoint (#1684).

## Problem

The site is not live yet, and staff are testing and fixing the statistics. They need a quick
look at the unique-visitors count for a recent period from the dashboard, and a way to wipe all
statistics data (with the IDs reset) between test rounds, without leaving the dashboard.

## Expected Behavior

- The dashboard shows a new card with the **unique visitors** for the selected period, a link to
  `/#/staff/statistics`, a period select and the **Reload** and **Clear** buttons.
- States:
  - data: `loading`, `error`, or loaded (shows the number);
  - action status: `idle`, `success` (shows the deleted counts) or `error`.
- **Period select:** `day` / `week` / `month`, default `day`. Changing it fetches the count
  again.
- **Reload** fetches the count again for the current period.
- **Clear** opens a confirmation modal with a text input. The confirm button is enabled only when
  the input equals `CLEAR`:
  - the word is always `CLEAR`, **not translated** and **case-sensitive**;
  - surrounding whitespace is trimmed before comparing;
  - the translated modal text tells the user to type `CLEAR`;
  - cancelling or closing the modal clears the input.
- **Clear success:** show a success status that includes `deleted_visits` and
  `deleted_sessions`, then fetch the count again.
- **Clear failure** (a 4xx, a 5xx, or a network error): show an error status, then **fetch the
  count again anyway**, because a partial clear may have happened.

### Edge cases

- The period select, Reload and Clear are **disabled while any request is in flight**, so a
  slower earlier response cannot overwrite a newer period's result, and double clicks are
  prevented.
- A period with no data shows `0`.
- A `403` (for example a revoked staff role) is shown as the regular error state.
- When the browser cannot resolve a timezone, `tz` is omitted (the server defaults to `UTC`).

### Acceptance criteria

- Jasmine specs cover:
  - rendering, period change and Reload;
  - the typed-confirmation flow: wrong text, exact text, surrounding whitespace, wrong case, and
    cancel clearing the input;
  - the post-clear fetch, on success (with the deleted counts shown) and on failure;
  - the loading, error and disabled states.
- ESLint passes and the translation keys stay in sync across languages.
- The full flow is verified end-to-end against the merged count (#1682) and clear (#1684)
  endpoints.

## Solution

### Card

- A new `VisitsSummaryCard` entry in
  `frontend/assets/js/components/resources/staff_dashboard/pages/dashboardCardConfig.js`, with no
  props beyond what the config passes to the other cards.
- It reuses `DashboardCard` / `CardActions` and follows the `MemoryCacheCard` patterns: a
  controller (`VisitsSummaryCardController`), a helper (`VisitsSummaryCardHelper`) and a
  confirmation modal (`ClearStatisticsConfirmModal`).
- New i18n keys for every user-facing text, in every supported language under
  `frontend/assets/i18n/` (`en` and `pt`), through the translator agent.

### Endpoints and wiring

- `GET staff/statistics/summary.json?period=<period>&tz=<tz>` returns
  `{"period", "from", "to", "tz", "unique_visitors"}`. `tz` comes from
  `Intl.DateTimeFormat().resolvedOptions().timeZone`.
- `DELETE staff/statistics.json` returns `{"deleted_visits", "deleted_sessions"}`.
- Add to `frontend/assets/js/utils/requests/config/staffStatisticsConfig.js`:
  - `GET.summary` → `/staff/statistics/summary.json`;
  - a `DELETE` entry → `/staff/statistics.json`;
  - both with `permission: null`, with the `regular` and `private` variants pointing to the same
    object, mirroring the existing entries. Update the file's doc comment.
- The read goes through `RequestStore.ensure`; the clear goes through
  `RequestStore.mutate({ method: 'DELETE', ... })` (`RequestMutationClient` already supports
  `DELETE`). No dedicated client like `StaffCacheClient`.

### Permissions

- **Who:** staff or superuser. The route `/#/staff/dashboard` is already gated by
  `staffOrSuperuser` (`frontend/assets/js/utils/access/accessRouteConfig.js`), plus
  `AccessStore.ensureStaffOrSuperUser()` like the other staff statistics screens.
- **No entry is added to `RequestPermissionResolvers.js`**, so both calls fall back to
  `NO_PERMISSIONS`, as for every other statistics endpoint.
- The Clear button is shown to everyone who can see the card; there is no extra client-side
  check. Server-side permissions and caching are already handled by the endpoints.

### Compatibility, performance and security

- The existing dashboard cards are unchanged.
- The count is fetched once per dashboard load, plus on period change and Reload; it is not
  cached server-side, by design of the count endpoint.
- The destructive clear is behind the typed `CLEAR` confirmation and the server-side staff check.

### Scope

- **In scope:** the card, its controller, helper and modal, the request config entries, the i18n
  keys and the Jasmine specs.
- **Out of scope:** any backend change, changes to the `/#/staff/statistics` page, and removing
  the specs (#1686).
