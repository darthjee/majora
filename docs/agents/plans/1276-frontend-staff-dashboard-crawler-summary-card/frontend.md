# Frontend Plan: /#/staff/dashboard crawler summary card

Main plan: [plan.md](plan.md)

## Overview

Build a new dashboard card, `CrawlerDebugCard`, mirroring the existing
memory-cache card triad
(`MemoryCacheCard.jsx` + `controllers/MemoryCacheCardController.js` +
`helpers/MemoryCacheCardHelper.jsx` + `ClearCacheConfirmModal.jsx`), wired to
the already-live backend endpoints:

- `GET /staff/crawler/summary.json` → JSON object of `{ "<type>": <count> }`
  (e.g. `{"stl_model": 42, "collection": 7}`); empty table returns `{}`.
- `DELETE /staff/crawler.json` → `204 No Content`, blanket clear.

Both endpoints are `@restricted` and enforce `require_staff` (401/403) and set
`X-Skip-Cache` themselves, so no `skipCache` config change and no new gating
logic are needed in the card. The `/#/staff/dashboard` page is already
staff-gated.

The harness (model, endpoints, debug page, this card) is explicitly temporary
and is deleted wholesale once issue #1262's real import endpoint is trusted
end-to-end (see `docs/agents/specs/crawler-test-harness.md`). Keep every new
file self-contained so removal is a clean `git rm` plus one line reverted in
`dashboardCardConfig.js` and the i18n files.

## Context

Precedent details confirmed in the codebase:

- `MemoryCacheCard.jsx` — function component holding `useState` for
  `summary`/`status`/`loading`/`error`/`showConfirm`, builds the controller
  via `useMemo(..., [])`, runs `useEffect(() => controller.buildEffect()(), [controller])`,
  renders `Helper.render(state, handlers)` followed by the confirm modal.
  `onClearCache` only opens the modal; the destructive call happens on the
  modal's `onConfirm`.
- `MemoryCacheCardController.js` — plain class (not `BasePageController`),
  constructor `(setSummary, setStatus, setLoading, setError, client = null)`
  with `this.client = client ?? new StaffCacheClient()` as the spec injection
  seam. `buildEffect()` returns a mount effect that fetches once behind a
  `mounted` guard; `refresh()` re-fetches unconditionally; `clearCache()` sets
  `status='loading'`, reads the token via `AuthStorage.getToken()`, calls the
  client, sets `status` to `success`/`error`, and `await this.refresh()` on
  success. `logData()` is a memory-card-only console.debug slot — omit it here.
- `MemoryCacheCardHelper.jsx` — static class; `render(state, handlers)` returns
  a `<DashboardCard top={<CardTop .../>} actions={<><CardActions .../>{feedback}</>} />`.
  `#buildActions` returns `[{icon: Icons.trash, tooltip, onClick: onClearCache, disabled}, {icon: Icons.arrowClockwise, tooltip, onClick: onRefresh, disabled}]`
  with `disabled = state.status === 'loading'`. `#renderData` branches on
  `loading` → muted text, `error || !data` → danger text, else the value
  display. `#renderFeedback` renders the success/error/`error` `<p>` lines.
  `MetricDisplay` is percentage-of-a-limit and does NOT apply to the crawler
  counts — the new helper needs its own `#renderCounts`.
- `StaffCacheClient.js` — `fetchSummary(token)` → `this.getJson('/staff/cache/summary.json', token)`;
  `clearCache(token)` → `this.request('/staff/cache.json', { method: 'DELETE', headers: this.buildHeaders(token) })`.
  `CrawlerClient.js` already exists (extends `BaseClient`, currently only
  `fetchEmissions`); `CrawlerClientSpec.js` already exists.
- `ClearCacheConfirmModal.jsx` (2-line component) + `helpers/ClearCacheConfirmModalHelper.jsx`
  render a `react-bootstrap/cjs/Modal.js` with `title`/`body`/`cancel`/`confirm`
  from the `clear_cache_confirm_modal.*` keys in `common.yaml` (namespace
  registered in `commonNamespaces` in `assets/i18n/en/index.js`).
- `dashboardCardConfig.js` — a plain array of `{ key, Component }` entries
  (`memory_cache`, `disk_cache`); no gating field. `StaffDashboardHelper`
  renders one grid column per entry; a 4th card just flows to the next cell.
- Spec tree mirrors the source tree under
  `frontend/specs/assets/js/components/resources/staff_dashboard/pages/elements/`;
  controller specs are a **directory** with one file per public method plus a
  shared `support.js` (`MemoryCacheCardController/` has
  `buildEffectSpec.js`, `clearCacheSpec.js`, `refreshSpec.js`, `logDataSpec.js`,
  `support.js`). Shared helpers: `specs/support/controllerStubs.js`
  (`stubBuildEffect`), `specs/support/fetchMock.js` (`mockFetchJson`).
- i18n namespace files are per-page (`assets/i18n/en/staff_dashboard.yaml`);
  the `pt/` equivalents are owned by the `translator` agent, and
  `yarn check_i18n` enforces en/pt key parity.

## Steps

- [01 — Add CrawlerClient summary + clear methods](frontend/01-crawler-client-methods.md)
- [02 — Add ClearCrawlerConfirmModal + i18n](frontend/02-clear-crawler-confirm-modal.md)
- [03 — Add CrawlerDebugCardController](frontend/03-crawler-debug-card-controller.md)
- [04 — Add CrawlerDebugCardHelper](frontend/04-crawler-debug-card-helper.md)
- [05 — Add CrawlerDebugCard, i18n keys, and dashboard registration](frontend/05-crawler-debug-card-and-registration.md)

## CI Checks

- `frontend`: `docker-compose run --rm majora_fe yarn lint` (CI job: `frontend-checks`)
- `frontend`: `docker-compose run --rm majora_fe yarn test` — Jasmine + coverage
  (CI job: `jasmine`, which runs `npm run coverage`)
- `frontend`: `docker-compose run --rm majora_fe yarn check_i18n` — en/pt key
  parity; expected to fail on the new keys until the `translator` agent adds
  the `pt/` side (flag, do not block)
- `docs/`: `yarn lint_md` (CI job: `markdownlint`) — covers the committed issue
  and plan markdown

## Notes

- Backend order of `summary.json` keys is not guaranteed (the queryset has no
  `order_by`); sort keys by `type` name in the helper for a stable display.
- The `Total: N` row is a frontend-computed sum of the count values — the
  backend does not return a total.
- Reusing `ClearCacheConfirmModal` was considered and rejected in issue
  discussion: its copy reads "Clear Cache", which is wrong on a crawler card.
  A dedicated `ClearCrawlerConfirmModal` with its own keys is in scope.
- `#renderCounts` as a private static method in `CrawlerDebugCardHelper` is
  preferred over a standalone `CrawlerTypeCounts.jsx` component — it is used in
  exactly one place and the harness is temporary (per the repo extraction
  guidance for a single-use conditional render block).
- `pt/` translations for both `staff_dashboard.yaml` and the new
  `clear_crawler_confirm_modal` block in `common.yaml` are out of scope here
  and must be flagged to the `translator` agent.
