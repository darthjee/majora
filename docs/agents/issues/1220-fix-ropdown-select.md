# Issue: Fix dropdown select

## Description

The `ResourcePickerSearch` component (`frontend/assets/js/components/common/forms/ResourcePickerSearch.jsx`, wrapped by `MultiResourcePickerField.jsx` and `SingleResourcePickerField.jsx` in the same folder) is used across pages such as `/#/miniatures/stl_models` to build filters for race, role, source, etc. It supports two modes:

- **API-backed mode**: queries an endpoint and retrieves entries that match by name, paginated server-side.
- **Local-constant mode** (added in #820 / PR #1109): filters a local hardcoded array client-side. Today this is used only for the `races` and `roles` filters on STL model pages, via `RACE_VALUES` (29 entries) and `ROLE_VALUES` (13 entries) in `stlModelEnums.js`.

## Problem

### Hardcoded list has no limit

When the list comes from an endpoint (API-backed mode), results are naturally bounded by the backend's pagination. In local-constant mode, however, the filtering function (`filterConstantResults` in `ResourcePickerSearch.jsx`) returns **all** entries that match the query — which is particularly bad when nothing has been typed yet, since the entire constant array (e.g. all 29 race values) is shown at once.

## Expected Behavior

- The local-constant mode of `ResourcePickerSearch` must restrict the displayed results to a **maximum of 5 entries**.
- This limit is a **fixed constant** internal to the component (not a configurable prop).
- When more than 5 entries match the query, only the **first 5** of the filtered array are shown — no additional ordering or relevance criterion.
- **No visual truncation indicator** is displayed (no "...", no "+N more" label, no badge). The dropdown simply stops at 5 entries.
- The API-backed mode is **unaffected** — the limit applies exclusively to the local-constant filtering path.
- The fix must be in the **component itself**, not in each page that uses it.

## Solution

### Component structure (confirmed)

- `frontend/assets/js/components/common/forms/ResourcePickerSearch.jsx` — core search/filter logic. Contains `filterConstantResults` (local-constant filtering, to be changed) and `fetchResourcePickerResults` (API-mode fetching, untouched). The two paths already branch cleanly via `isConstantMode`.
- `frontend/assets/js/components/common/forms/helpers/ResourcePickerSearchHelper.jsx` — pure render helper, mode-agnostic, no changes needed.
- `frontend/assets/js/components/common/forms/MultiResourcePickerField.jsx` / `SingleResourcePickerField.jsx` — thin wrappers around the core component, no changes needed.

### Apply the limit

In `filterConstantResults`, apply `.slice(0, MAX_CONSTANT_RESULTS)` after the existing `.filter(...)`:

```js
const MAX_CONSTANT_RESULTS = 5;

export function filterConstantResults({ values, translateOption, searchTerm }) {
  const term = searchTerm.trim().toLowerCase();
  return values
    .map((value) => ({ id: value, name: translateOption(value) }))
    .filter((item) => item.name.toLowerCase().includes(term))
    .slice(0, MAX_CONSTANT_RESULTS);
}
```

Name the constant `MAX_CONSTANT_RESULTS`, not `MAX_RESULTS` or `maxEntries` — the component already has a `maxEntries` prop that is API-mode-only (maps to `per_page`) and explicitly ignored in constant mode; a distinct name avoids implying any relationship between the two.

### Scope

- Only `filterConstantResults` is touched. `fetchResourcePickerResults` (API path) is untouched.
- No changes to consumer pages (`StlModelFormFieldsHelper.jsx`, `StlModelFilters.jsx` / `StlModelFiltersHelper.jsx`) — currently the only consumers of local-constant mode (via `races`/`roles`).
- No visual indicator of truncation is added anywhere.

### Tests

Extend `frontend/specs/assets/js/components/common/forms/ResourcePickerSearchSpec.js`, which already has a `describe('.filterConstantResults', ...)` block:

1. **Query empty, >5 values available** — result has exactly 5 entries.
2. **Query with >5 matches** — result is the first 5.
3. **Query with ≤5 matches** — all matches returned (no truncation).
4. **API-backed mode** (`fetchResourcePickerResults`) — unaffected, no slicing applied.

### Out of scope

- Making `MAX_CONSTANT_RESULTS` configurable via a prop.
- Adding a visual truncation indicator ("..." or "+N more").
- Changes to the API-backed mode or to any consumer page.
- Changes to `stlModelEnums.js` constant lists.

## Benefits

- Better UX: the dropdown no longer floods the screen with the entire hardcoded list when nothing has been typed.
- Minimal, isolated change in the component itself (`filterConstantResults`) — no ripple effect across consumer pages.
- Consistent with the API-backed mode, which already limits results.
