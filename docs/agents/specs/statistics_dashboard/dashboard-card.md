# Dashboard card

Part of the [Statistics Dashboard](../statistics_dashboard.md) spec.

## Purpose

The staff dashboard card that shows the unique-visitors count for a selected period, with
Reload, Clear (behind a typed confirmation) and a link to the full statistics page.

## Contract

**Component**

- A new entry in
  `frontend/assets/js/components/resources/staff_dashboard/pages/dashboardCardConfig.js`.
- The card reuses `DashboardCard` / `CardActions` (`elements/CardActions.jsx`) and follows the
  `MemoryCacheCard` patterns (`elements/MemoryCacheCard.jsx`): a controller, a helper and a
  confirmation modal.
- No props beyond what `dashboardCardConfig.js` passes to the other cards.

**States**

- Data: `loading`, `error`, or loaded (shows the number).
- Action status: `idle`, `success` (shows the deleted counts) or `error`.

**Endpoints called** (payloads as in the endpoint pages):

- `GET staff/statistics/summary.json?period=<period>&tz=<tz>` —
  [count-endpoint.md](count-endpoint.md).
- `DELETE staff/statistics.json` — [clear-endpoint.md](clear-endpoint.md).

`tz` comes from `Intl.DateTimeFormat().resolvedOptions().timeZone`.

## Behaviour

- **Period select:** `day` / `week` / `month`, default `day`. Changing it fetches the count
  again.
- **Reload** fetches the count again for the current period.
- **Clear** opens a confirmation modal with a text input. The confirm button is enabled only
  when the input equals `CLEAR`:
  - the word is always `CLEAR`, **not translated** and **case-sensitive**;
  - surrounding whitespace is trimmed before comparing;
  - the translated modal text tells the user to type `CLEAR`;
  - cancelling or closing the modal clears the input.
- **Clear success:** show a success status that includes `deleted_visits` and
  `deleted_sessions`, then fetch the count again.
- **Clear failure** (a 4xx other than validation, a 5xx, or a network error): show an error
  status, then **fetch the count again anyway**, because a partial clear may have happened.
- A link to `/#/staff/statistics`.
- New i18n keys for every user-facing text, in every supported language under
  `frontend/assets/i18n/`.

## Permissions & caching

- **Who:** staff or superuser. The route `/#/staff/dashboard` is already gated by
  `staffOrSuperuser` (`frontend/assets/js/utils/access/accessRouteConfig.js`), plus
  `AccessStore.ensureStaffOrSuperUser()` like the other staff statistics screens.
- **Both calls go through `RequestStore`.** Add to
  `frontend/assets/js/utils/requests/config/staffStatisticsConfig.js`:
  - `GET.summary` → `/staff/statistics/summary.json`;
  - a `DELETE` entry → `/staff/statistics.json`;
  - both with `permission: null`, the `regular` and `private` variants pointing to the same
    object, mirroring the existing entries.
- **No entry is added to `RequestPermissionResolvers.js`**
  (`frontend/assets/js/utils/requests/RequestPermissionResolvers.js`), so it falls back to
  `NO_PERMISSIONS`, as for every other statistics endpoint.
- The clear uses `RequestStore.mutate`. The card does **not** use a dedicated client like
  `StaffCacheClient`.
- **Clear button visibility:** shown to everyone who can see the card; there is no extra
  client-side check. A server `403` is handled as a regular error state.
- Server-side permissions and caching: see the endpoint pages.

## Edge cases

- The period select, Reload and Clear are **disabled while any request is in flight**, so a
  slower earlier response cannot overwrite a newer period's result, and double clicks are
  prevented.
- A period with no data shows `0`.
- If the browser cannot resolve a timezone, the card omits `tz` (the server defaults to `UTC`).
- A `403` (for example a revoked staff role) is shown as the regular error state.

## Tests

Jasmine specs covering:

- rendering, period change and Reload;
- the typed-confirmation flow: wrong text, exact text, surrounding whitespace, wrong case, and
  cancel clearing the input;
- the post-clear fetch, on success (with the deleted counts shown) and on failure;
- the loading, error and disabled states.

ESLint passes and the translation keys stay in sync across languages.

## Open questions

None.

## Implemented by

#1685. It builds against the contracts in this spec; the end-to-end check needs #1682 and
#1684.
