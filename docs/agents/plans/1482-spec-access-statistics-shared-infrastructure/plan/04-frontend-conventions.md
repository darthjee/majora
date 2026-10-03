# Frontend conventions: RequestStore and Recharts

- **RequestStore:** a `staffStatistics` resource config in
  `frontend/assets/js/utils/requests/config/staffStatisticsConfig.js`, registered in
  `resourceConfig.js`, `permission: null`, same object for `regular` / `private`, no entry in
  `RequestPermissionResolvers.js` (following `staffUserConfig.js` / `staffPhotoConfig.js`).
  Define how filter params are passed (query string built from the URL state + `tz`).
- **Recharts sizing:** pick fixed size vs `ResponsiveContainer`; if the latter, define the
  `ResizeObserver` stub for Jasmine (where it lives in the spec helpers) and verify the smoke
  test pattern renders the `data-testid` wrapper without layout.
- **Lazy loading:** the dynamic `import()` boundary (the statistics route chunk) and the
  loading fallback.
- **Colors:** the CSS variable names for series and where they are declared.
- **File layout** for a chart's client / controller / helper / component, matching the
  existing `components/resources/<name>/pages/{controllers,helpers,elements}` layout.

## Files to Change
- `docs/agents/specs/access-statistics/shared-infrastructure.md` — RequestStore and Recharts conventions sections.
