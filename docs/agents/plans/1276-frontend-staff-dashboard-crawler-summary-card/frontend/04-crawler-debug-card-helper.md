# Add CrawlerDebugCardHelper

Create `elements/helpers/CrawlerDebugCardHelper.jsx` as a copy of
`MemoryCacheCardHelper.jsx` with these differences:

- `render(state, handlers)` — same `DashboardCard` / `CardTop` / `CardActions`
  structure. `CardTop` `title` = `Translator.t('staff_dashboard.crawler_debug_title')`.
  Drop the `onDataClick` prop (no clickable data area) — pass nothing, matching
  `DiskCacheCard`'s omission.
- `#buildActions(state, handlers)` — same two actions (`Icons.trash` +
  `Icons.arrowClockwise`), `disabled = state.status === 'loading'`. Trash
  tooltip = `Translator.t('staff_dashboard.crawler_clear_tooltip')`; refresh
  tooltip reuses `staff_dashboard.refresh_tooltip`.
- `#renderData(state)`:
  - `state.loading` → `<span className="text-muted">{t('staff_dashboard.loading')}</span>`.
  - `state.error || !state.counts` →
    `<span className="text-danger">{t('staff_dashboard.crawler_summary_load_error')}</span>`.
  - `Object.keys(state.counts).length === 0` →
    `<span className="text-muted">{t('staff_dashboard.crawler_summary_empty')}</span>`
    ("No entries yet").
  - otherwise → `CrawlerDebugCardHelper.#renderCounts(state.counts)`.
- New `static #renderCounts(counts)` — render a small definition/description
  list of `type → count` rows sorted by `type` name
  (`Object.keys(counts).sort()`), followed by a `Total: N` row where
  `N = Object.values(counts).reduce((a, b) => a + b, 0)`. Use a plain
  `<dl>`/`<ul>` with existing Bootstrap utility classes (match the compact,
  centered look of `MetricDisplay`'s output; no new CSS/SCSS). The total row
  label = `Translator.t('staff_dashboard.crawler_summary_total', { count: N })`
  (or a plain `t('...crawler_summary_total')` label + the number if the
  Translator interpolation form is not used elsewhere — check a sibling call).
- `#renderFeedback(state)`:
  - `status === 'success'` → `<p className="text-success mt-2 mb-0 text-center">{t('staff_dashboard.crawler_clear_success')}</p>`.
  - `status === 'error'` → `<p className="text-danger mt-2 mb-0 text-center">{t('staff_dashboard.crawler_clear_error')}</p>`.
  - `state.error` → `<p className="text-danger mt-2 mb-0 text-center">{t('staff_dashboard.crawler_summary_load_error')}</p>`.
  - else `null`.

The actual i18n keys are added in step 05.

Spec — `elements/helpers/CrawlerDebugCardHelperSpec.js`, mirroring
`MemoryCacheCardHelperSpec.js`:

- title + loading indicator render.
- counts list renders sorted rows and a correct `Total` for a non-empty
  `counts` object (e.g. `{ collection: 7, stl_model: 42 }` → rows in
  `collection, stl_model` order, total `49`).
- empty-state message renders for `counts = {}`.
- summary-load-error text renders when `error` is true.
- success / clear-error feedback text renders for the respective `status`.
- both action buttons `disabled` while `status === 'loading'`.
- clear/refresh handlers are wired into the actions array; distinct icons
  (`bi-trash-fill`, `bi-arrow-clockwise`).

## Files to Change

- `frontend/assets/js/components/resources/staff_dashboard/pages/elements/helpers/CrawlerDebugCardHelper.jsx` — new helper.
- `frontend/specs/assets/js/components/resources/staff_dashboard/pages/elements/helpers/CrawlerDebugCardHelperSpec.js` — new spec.
