# Paths and Session columns

In `StatisticsVisitListTableHelper`, add two plain (non-sortable) headers after Hits, `t('paths')`
and `t('session')`, and the matching cells in each row:

- **Paths** cell: two lines, `t('first_path')` + the visit's `firstPath`, and `t('last_path')` +
  its `lastPath`.
- **Session** cell: `t('session_first_path')` + `sessionFirstPath`, `t('creation_reason')` + the
  reason label, `t('first_seen_logged')` + `t('yes')` / `t('no')`.
- **Path values** render as-is (route patterns or `unresolved`) in a `font-monospace` +
  `text-truncate` element with a fixed max width and the full value in `title`.
- **Reason label:** `Translator.t('staff_statistics_page.visit_list.creation_reasons.<value>')`,
  falling back to the raw value when the value is not one of the six known reasons (keep a frozen
  list of the known values in the helper rather than relying on a missing-key result).
- **`null`** for any of the five fields renders `t('unknown')`; the logged flag shows `t('no')`
  only for `false`.
- Keep the table `responsive`; add `data-testid`s for the new cells (e.g.
  `statistics-visit-list-paths-<id>`, `statistics-visit-list-session-<id>`). Update the JSDoc of
  the helper and of `StatisticsVisitListTable`.

Specs: headers present (and not sortable links); both cells with values; each of the six reason
labels; the raw-value fallback; the truncation `title`; `null` → "unknown" for each field;
`false` → "no".

## Files to Change

- `frontend/assets/js/components/resources/staff_statistics/pages/elements/helpers/StatisticsVisitListTableHelper.jsx` — the two columns.
- `frontend/assets/js/components/resources/staff_statistics/pages/elements/StatisticsVisitListTable.jsx` — JSDoc.
- `frontend/specs/assets/js/components/resources/staff_statistics/pages/elements/helpers/StatisticsVisitListTableHelperSpec.js` — rendering specs.
- `frontend/specs/assets/js/components/resources/staff_statistics/pages/elements/StatisticsVisitListTableSpec.js` — row fixtures with the new fields.
