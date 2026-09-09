# Add CrawlerDebugCard, i18n keys, and dashboard registration

## Component

Create `elements/CrawlerDebugCard.jsx` as a copy of `MemoryCacheCard.jsx`:

- `useState` for `counts` (init `null`), `status` (`'idle'`), `loading`
  (`true`), `error` (`false`), `showConfirm` (`false`).
- `const controller = useMemo(() => new CrawlerDebugCardController(setCounts, setStatus, setLoading, setError), [])`.
- `useEffect(() => controller.buildEffect()(), [controller])`.
- Render:
  ```jsx
  <>
    {CrawlerDebugCardHelper.render(
      { counts, status, loading, error },
      {
        onClearCache: () => setShowConfirm(true),
        onRefresh: () => controller.refresh(),
      },
    )}
    <ClearCrawlerConfirmModal
      show={showConfirm}
      onConfirm={() => { setShowConfirm(false); controller.clearEmissions(); }}
      onCancel={() => setShowConfirm(false)}
    />
  </>
  ```
  (No `onDataClick` handler.)

## i18n keys

Add to `assets/i18n/en/staff_dashboard.yaml` under the `staff_dashboard:` map:

```yaml
  crawler_debug_title: Crawler Debug
  crawler_clear_tooltip: Clear entries
  crawler_clear_success: Crawler entries cleared successfully.
  crawler_clear_error: Failed to clear crawler entries. Please try again.
  crawler_summary_load_error: Unable to load crawler summary.
  crawler_summary_empty: No entries yet.
  crawler_summary_total: 'Total: {{count}}'
```

(`loading` and `refresh_tooltip` already exist and are reused. If the
`{{count}}` interpolation form is not already used in this file, use a plain
`crawler_summary_total: Total` label and render the number next to it in the
helper instead.) The `pt/staff_dashboard.yaml` equivalents are the
`translator` agent's responsibility — flag them; `yarn check_i18n` will report
the gap until they land.

## Dashboard registration

In `assets/js/components/resources/staff_dashboard/pages/dashboardCardConfig.js`:

- `import CrawlerDebugCard from './elements/CrawlerDebugCard.jsx';`
- append `{ key: 'crawler_debug', Component: CrawlerDebugCard }` to the exported
  array (after `disk_cache`).

## Specs

- `elements/CrawlerDebugCardSpec.js` — mirror `MemoryCacheCardSpec.js`: renders
  the loading state (title `'Crawler Debug'` + loading text); renders both
  action icons; clicking "Clear entries" does NOT call
  `CrawlerDebugCardController.prototype.clearEmissions` without a modal confirm
  click. Use `stubBuildEffect` + `renderToStaticMarkup`.
- `StaffDashboardHelperSpec.js` — the existing "one column per config entry"
  and "renders each configured card" assertions cover the new card
  automatically; add an explicit assertion that the `'Crawler Debug'` title is
  rendered.

## Files to Change

- `frontend/assets/js/components/resources/staff_dashboard/pages/elements/CrawlerDebugCard.jsx` — new component.
- `frontend/assets/js/components/resources/staff_dashboard/pages/dashboardCardConfig.js` — import + register the card.
- `frontend/assets/i18n/en/staff_dashboard.yaml` — add the 6–7 new keys.
- `frontend/specs/assets/js/components/resources/staff_dashboard/pages/elements/CrawlerDebugCardSpec.js` — new spec.
- `frontend/specs/assets/js/components/resources/staff_dashboard/pages/StaffDashboardHelperSpec.js` — add a title assertion for the new card.
