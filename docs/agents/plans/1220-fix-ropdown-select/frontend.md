# Frontend Plan: Fix dropdown select

Main plan: [plan.md](plan.md)

## Implementation Steps

### Step 1 — Limit `filterConstantResults` to 5 entries

In `frontend/assets/js/components/common/forms/ResourcePickerSearch.jsx`, add a module-level constant `MAX_CONSTANT_RESULTS = 5` and apply `.slice(0, MAX_CONSTANT_RESULTS)` after the existing `.filter(...)` inside `filterConstantResults`:

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

Name it `MAX_CONSTANT_RESULTS`, not `MAX_RESULTS`/`maxEntries` — the component already has a `maxEntries` prop that is API-mode-only (maps to `per_page`) and explicitly ignored in constant mode; a distinct name avoids implying any relationship between the two. Do not touch `fetchResourcePickerResults` (the API-backed path) or any consumer page — `filterConstantResults` is the only code path exercised by local-constant mode.

### Step 2 — Extend the specs

In `frontend/specs/assets/js/components/common/forms/ResourcePickerSearchSpec.js`, extend the existing `describe('.filterConstantResults', ...)` block with cases:

1. Query empty, more than 5 values available in the input array — result has exactly 5 entries.
2. Query with more than 5 matches — result is the first 5 matches, in original array order.
3. Query with 5 or fewer matches — all matches returned, no truncation.
4. Confirm `fetchResourcePickerResults` / the API-backed path specs are unaffected (no slicing applied there) — add a case only if none already covers this; otherwise note it's already covered.

## Files to Change

- `frontend/assets/js/components/common/forms/ResourcePickerSearch.jsx` — add `MAX_CONSTANT_RESULTS = 5` constant and `.slice(0, MAX_CONSTANT_RESULTS)` in `filterConstantResults`.
- `frontend/specs/assets/js/components/common/forms/ResourcePickerSearchSpec.js` — add the 4 test cases above to the `.filterConstantResults` describe block.

## CI Checks

- `frontend`: `npm run coverage` (CI job: `jasmine`)
- `frontend`: `npm run lint` (CI job: `frontend-checks`)

## Notes

- Only `races` and `roles` filters (on STL model pages, via `RACE_VALUES`: 29 entries, `ROLE_VALUES`: 13 entries in `stlModelEnums.js`) currently use local-constant mode, so this is the only user-visible surface affected.
- No visual truncation indicator ("...", "+N more") is added — out of scope per the issue.
- `MAX_CONSTANT_RESULTS` must not be exposed as a prop — it is a fixed internal constant.
