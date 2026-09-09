# Issue: Frontend — /#/staff/dashboard crawler summary card

## Description

Sub-issue of the parent tracking issue #1260 (Lootstudios STL Crawler), and a
sibling of "Backend — crawler debug harness summary + clear endpoints" (#1275,
already merged, which this consumes) and "Frontend — /#/staff/crawler two-column
debug page" (#1274, the full record-browsing page this card complements). Part
of the temporary crawler emission debug harness specified in
`docs/agents/specs/crawler-test-harness.md`.

Staff watching/testing a crawler run want an at-a-glance count of what's been
captured, and a one-click way to clear the table between runs, without leaving
`/#/staff/dashboard` to open the full record-browsing page.

The harness (model, endpoints, debug page, and this card) is explicitly
temporary — it is deleted once issue #1262's real import endpoint is trusted
end-to-end. Keep the card self-contained and trivial to remove: its own files
under `staff_dashboard/pages/elements/`, one line in `dashboardCardConfig.js`,
and its own i18n keys.

## Problem

The blanket-clear and per-`type` count operations exposed by
`GET /staff/crawler/summary.json` and `DELETE /staff/crawler.json` (both live
as of commit 4f9a2749) currently have no UI. During a crawler run a staff
member has to hit the JSON endpoints by hand to see progress or reset the
table between runs.

## Expected Behavior

- A new card appears on `/#/staff/dashboard`, alongside the existing Memory
  Cache and Disk Cache cards.
- The card shows per-`type` entry counts fetched from
  `GET /staff/crawler/summary.json` (response is a JSON object, e.g.
  `{"stl_model": 42, "collection": 7}`; empty table returns `{}`).
- Counts render as a `type → count` list sorted by `type` name (the backend
  order is not guaranteed), followed by a summed `Total: N` row.
- When the response is `{}` the card shows a distinct "No entries yet"
  empty-state message instead of the list.
- Loading and summary-load-error states mirror the memory-cache card.
- A clear (trash) action opens a crawler-specific confirmation modal;
  confirming calls `DELETE /staff/crawler.json` (returns `204`), then the
  counts refresh.
- A refresh action re-fetches the counts on demand.
- The card is staff/superuser-only — the dashboard page is already staff-gated,
  and the backend endpoints enforce `require_staff` (401/403) independently, so
  no new gating logic is added in this card.

## Solution

Follow the memory-cache dashboard card precedent exactly:
`MemoryCacheCard.jsx` + `controllers/MemoryCacheCardController.js` +
`helpers/MemoryCacheCardHelper.jsx` + `ClearCacheConfirmModal.jsx`.

New files under
`frontend/assets/js/components/resources/staff_dashboard/pages/elements/`:

- `CrawlerDebugCard.jsx` — copy of `MemoryCacheCard.jsx`; state holds `counts`
  (object | null) instead of `summary`; no `onDataClick`/`logData` slot.
- `controllers/CrawlerDebugCardController.js` — copy of
  `MemoryCacheCardController.js` minus `logData`; `client` defaults to a
  `CrawlerClient` instance; `#fetchSummary` sets `counts`; the clear method
  calls `client.clearEmissions(token)` then `refresh()`.
- `helpers/CrawlerDebugCardHelper.jsx` — copy of `MemoryCacheCardHelper.jsx`;
  `#renderData` renders the per-`type` counts (a small list/`<dl>`, **not**
  `MetricDisplay`, which is percentage-of-a-limit and does not apply here),
  sorted by `type` name, with a summed `Total: N` row, and a dedicated
  "No entries yet" empty-state branch for `{}`.
- `ClearCrawlerConfirmModal.jsx` (+ `helpers/ClearCrawlerConfirmModalHelper.jsx`)
  — sibling of `ClearCacheConfirmModal.jsx` with crawler-specific copy
  (e.g. "Clear crawler entries" / "This action cannot be undone."), so the
  dialog does not read "Clear Cache" on a crawler card.

Modified files:

- `frontend/assets/js/client/CrawlerClient.js` — add `fetchSummary(token)` →
  `getJson('/staff/crawler/summary.json', token)` and `clearEmissions(token)` →
  `request('/staff/crawler.json', { method: 'DELETE', headers: buildHeaders(token) })`,
  mirroring `StaffCacheClient`. No `skipCache` config change — the backend view
  is `@restricted` and sets `X-Skip-Cache` itself.
- `frontend/assets/js/components/resources/staff_dashboard/pages/dashboardCardConfig.js`
  — append `{ key: 'crawler_debug', Component: CrawlerDebugCard }`.
- `frontend/assets/i18n/en/staff_dashboard.yaml` — add the card's title,
  summary-load-error, empty-state ("No entries yet"), total-row label,
  clear-tooltip, clear-success and clear-error keys. `loading` and
  `refresh_tooltip` are reused as-is.
- `frontend/assets/i18n/en/common.yaml` (+ `en/index.js` `commonNamespaces`)
  — add a `clear_crawler_confirm_modal` block (title/body/confirm/cancel) for
  the new modal, mirroring `clear_cache_confirm_modal`.
- The `pt/` equivalents for both files are the `translator` agent's
  responsibility; flag the gap (`yarn check_i18n` enforces en/pt parity).

Specs mirror the source tree under
`frontend/specs/assets/js/components/resources/staff_dashboard/pages/elements/`:
`CrawlerDebugCardSpec.js`, `helpers/CrawlerDebugCardHelperSpec.js`,
`ClearCrawlerConfirmModalSpec.js`,
`helpers/ClearCrawlerConfirmModalHelperSpec.js`, and a
`controllers/CrawlerDebugCardController/` directory with `buildEffectSpec.js`,
`clearEmissionsSpec.js`, `refreshSpec.js` and `support.js` — matching the
`MemoryCacheCardController/` layout. Add `fetchSummary`/`clearEmissions`
coverage to `CrawlerClientSpec.js`, and (optionally) a title assertion for the
new card in `StaffDashboardHelperSpec.js`.

## Explicitly out of scope

- The full record-browsing page at `/#/staff/crawler` (#1274).
- The summary/clear backend endpoints themselves (#1275).
- Any per-`type`/`source` scoped clearing UI — the clear button is a blanket
  clear, matching the backend contract.
- `pt/` translations — owned by the `translator` agent.

## Acceptance criteria

- [ ] A new card on `/#/staff/dashboard` shows per-`type` entry counts from
      `GET /staff/crawler/summary.json`, sorted by `type` name and followed by
      a `Total: N` row, with loading and error states mirroring the
      memory-cache card
- [ ] The `{}` (empty table) response renders a distinct "No entries yet"
      empty-state message
- [ ] The card's clear button confirms via a new `ClearCrawlerConfirmModal`
      (crawler-specific copy) before calling `DELETE /staff/crawler.json`
- [ ] Counts refresh after a successful clear, and a refresh action re-fetches
      on demand
- [ ] `CrawlerClient` gains `fetchSummary`/`clearEmissions`, and the card is
      registered in `dashboardCardConfig.js`
- [ ] English i18n keys are added under `staff_dashboard` and a
      `clear_crawler_confirm_modal` block under `common`; the `pt` gap is
      flagged to the `translator` agent
- [ ] Specs exist for the new component/helper/controller and the new modal,
      following this repo's mirrored spec-folder convention, plus `CrawlerClient`
      coverage

## Benefits

- Staff get progress-at-a-glance and a safe one-click reset during crawler
  test runs, without leaving the dashboard.
- Reuses an established card pattern, keeping the temporary harness small and
  removable.

Owned by: `frontend`.
