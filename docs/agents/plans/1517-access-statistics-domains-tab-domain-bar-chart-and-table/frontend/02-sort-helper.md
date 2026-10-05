# Sort helper

Pure `sortDomains(rows, { key, direction })`: no key keeps API order; the unknown row is always last
regardless of direction; `null` values sort after numbers; strings use `localeCompare`. Split null/unknown
handling into small functions to stay under complexity 10.

## Files to Change
- `SS/pages/helpers/domainsSort.js` — new
- `SPEC/pages/helpers/domainsSortSpec.js` — new (empty, single row, normal, `null` durations, unknown pinned in both directions)
