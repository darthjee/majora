# Quantity type and controller

Add the `domainsSummary` quantity type and a `DomainsController` mirroring `DurationController`.

- `staffStatisticsConfig.js`: `const domainsSummary = { path: () => '/staff/statistics/domains/summary.json', permission: null };`
  and `GET.domainsSummary: { regular: domainsSummary, private: domainsSummary }`; update the JSDoc.
- `DomainsController` extends `BasePageController`, `(setData, setLoading, setError)`, `static map(response)`
  and `buildEffect()` calling `RequestStore.ensure({ componentName: 'DomainsController', resource: 'staffStatistics',
  quantityType: 'domainsSummary', query: StatisticsQuery.fromHash() })`; errors use
  `Translator.t('staff_statistics_page.domains.load_error')`.
- `map` returns `{ domains, totals, series: audienceSeries(audience), audience, filters, empty: totals.visits === 0, noRows: domains.length === 0 }`;
  each row is `{ id, domain, group, label, anonymous, logged_in, visits, unique_visitors, average_duration_seconds,
  median_duration_seconds, loggedInShare, unknown }` with `label` = translated "unknown" for the unknown row.
- Specs: empty list, zero totals, single row, normal data, `null` durations, unknown row, each audience, fetch error.

## Files to Change
- `frontend/assets/js/utils/requests/config/staffStatisticsConfig.js` — add `domainsSummary`
- `frontend/specs/assets/js/utils/requests/resourceConfigStaffStatisticsSpec.js` — add `GET.domainsSummary` case
- `SS/pages/controllers/DomainsController.js` — new
- `SPEC/pages/controllers/DomainsControllerSpec.js` — new
