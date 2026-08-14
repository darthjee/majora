# Frontend Plan: Add filters to /#/miniatures/stl_models

Main plan: [plan.md](plan.md)

## Shared contracts

Must build requests to `GET /miniatures/stl_models.json` using the eight query params in [plan.md](plan.md)'s "Shared contracts" table — `race`/`roles`/`source`/`collection`/`tags` as repeated params (one query-string entry per selected value), the rest scalar. Backend ignores an unrecognized `type`/`size` value rather than erroring, so no client-side validation is required beyond what the dropdowns already constrain.

Reused as-is (from #820, already correct — no changes needed to these): `TYPE_VALUES`/`RACE_VALUES`/`ROLE_VALUES`/`SIZE_VALUES` in `frontend/assets/js/components/resources/stl_model/stlModelEnums.js`, and the `stl_model_page.type_<value>`/`race_<value>`/`role_<value>`/`size_<value>` translation keys.

## Implementation Steps

### Step 1 — Extend the shared filter-URL infra for multi-value fields

This is prerequisite plumbing no existing filters bar has needed (`NpcFilters`, `TreasureFilters`, `PollFilters`, `StaffUsersFilters` are all scalar-only). Do this before building `StlModelFilters` itself.

- `frontend/assets/js/utils/routing/HashRouteResolver.js`: add `name`, `type`, `race`, `roles`, `source`, `collection`, `tags`, `size` to `FILTER_KEYS`. Change `getFilterParams()` so a key with multiple values in the hash's `URLSearchParams` keeps all of them (iterate `query.getAll(key)` and `params.append(...)` per value, or an equivalent that doesn't call `.set()`) instead of collapsing to the last one. Keep the return type a `URLSearchParams` (existing callers doing `.get(key)` for a scalar key are unaffected — `.get()` already returns just the first value).
- `frontend/assets/js/client/GenericClient.js`: in `#buildIndexParams(extraParams)`, branch on `Array.isArray(value)` — for an array, `params.delete(key)` then `value.forEach((v) => params.append(key, v))` (skipping empty/blank entries the same way the scalar branch already skips `undefined`/`null`/`''`); keep the existing scalar `params.set(key, value)` path for non-array values. This is the layer that actually serializes the outgoing request's query string, so it's required even though `getFilterParams()` above already preserves the values.

### Step 2 — `StlModelFilters` element

Add `frontend/assets/js/components/resources/stl_model/pages/elements/StlModelFilters.jsx` (+ `controllers/StlModelFiltersController.js` and `helpers/StlModelFiltersHelper.jsx`), following the `TreasureFilters`/`TreasureFiltersController`/`TreasureFiltersHelper` trio shape:

- Draft state seeded from `new HashRouteResolver().getFilterParams()`: scalar fields (`name`, `type`, `size`) via `.get(key) ?? ''`; multi-value fields (`race`, `roles`, `source`, `collection`, `tags`) via `.getAll(key)`, shaped as the `{id, name}[]` arrays `MultiResourcePickerField`/`TagsField` expect (`race`/`roles` constant-mode entries are `{id: value, name: translateOption(value)}`, matching `MultiResourcePickerField`'s own constant-mode shape documented in its JSDoc; `source`/`collection` need each id resolved to a `{id, name}` pair — check whether `ResourcePickerSearch`'s API mode already exposes a fetch-by-id helper for pre-populating a picker from hash ids, since `MultiResourcePickerField` itself only handles picking new items, not resolving pre-selected ones — this is the one open question flagged in Notes below).
- Widgets, one per field:
  - `name` — plain text input (same shape as `TreasureFiltersHelper`'s name input).
  - `type` — `EnumSelectField` with `values={TYPE_VALUES}`, `nullable`, translating via `stl_model_page.type_<value>`.
  - `size` — `EnumSelectField` with `values={SIZE_VALUES}`, `nullable`, translating via `stl_model_page.size_<value>`.
  - `race` — `MultiResourcePickerField` in constant mode (`values={RACE_VALUES}`, `translateOption` via `stl_model_page.race_<value>`), same as the create/edit form's races field.
  - `roles` — same pattern against `ROLE_VALUES`/`stl_model_page.role_<value>`.
  - `source` — `MultiResourcePickerField` in API mode (`resource="source"`), same as the create/edit form's sources field.
  - `collection` — same pattern, `resource="collection"`.
  - `tags` — `TagsField`, same as the create/edit form's tags field (free-type, comma-or-Enter-separated, badge list).
- `buildQuery(...)` (in the controller, mirroring `TreasureFiltersController.buildQuery`) returns scalar strings for `name`/`type`/`size` and plain string arrays for `race`/`roles`/`source`/`collection`/`tags` (mapping each picked `{id, name}` down to just `id`), passed through `buildFilterQuery` (see Step 3) rather than the current scalar-only entries array.
- `onClear` resets every field to its blank/empty value, matching `TreasureFiltersController.clear()`.

### Step 3 — Extend `buildFilterQuery` for array values

`frontend/assets/js/utils/filters/buildFilterQuery.js` currently only omits a blank string. Extend the entries reducer to also accept an array value: omit it when empty (`value.length === 0`), otherwise keep the array as-is in the built query object (so it flows through as an array into `GenericClient#buildIndexParams`'s new `Array.isArray` branch from Step 1).

### Step 4 — Wire into the list type config

Edit `frontend/assets/js/components/common/list_types/configs/stlModelListType.js`:
- Import `StlModelFilters` and set it as `filtersComponent`.
- Update `fetchStlModels` to build `extraParams` from `hashResolver.getFilterParams()` array-aware — group entries by key into `string | string[]` (single value stays scalar, matching every other list type's existing `Object.fromEntries(...)` shape; 2+ values becomes an array) rather than reusing `Object.fromEntries()` directly (which would silently drop all but the last value for a repeated key), then pass that as `extraParams` alongside pagination, same call shape as `globalTreasureListType.js`'s `fetchGlobalTreasures`.
- Update the file's own doc comments (`fetchStlModels`'s and the module's top-of-file comment both currently say "no filters" / "this list has ... no filters") to reflect the new filters bar.

### Step 5 — Tests

- `StlModelFiltersController`/`StlModelFiltersHelper` specs mirroring `TreasureFiltersController`/`TreasureFiltersHelper`'s existing specs: draft-state seeding from hash params (including multi-value seeding), each field's change handler, `buildQuery()`'s output shape (scalars vs. arrays, blank omission), and `clear()`.
- `stlModelListType.js` spec coverage for the updated `fetchStlModels`: single-value and multi-value filter params both end up correctly shaped in the request.
- `HashRouteResolver` spec coverage for `getFilterParams()` preserving repeated values for a multi-value key, without breaking the existing scalar-key specs.
- `GenericClient` spec coverage for `#buildIndexParams`'s new array branch (one param entry per array value; unaffected scalar behavior for existing callers).
- `buildFilterQuery` spec coverage for the new array-value branch (kept when non-empty, omitted when empty, existing scalar behavior unchanged).

## Files to Change

- `frontend/assets/js/utils/routing/HashRouteResolver.js` — `FILTER_KEYS` additions; `getFilterParams()` preserves multi-value keys.
- `frontend/assets/js/client/GenericClient.js` — `#buildIndexParams` array-value branch.
- `frontend/assets/js/utils/filters/buildFilterQuery.js` — array-value branch.
- `frontend/assets/js/components/resources/stl_model/pages/elements/StlModelFilters.jsx` — new.
- `frontend/assets/js/components/resources/stl_model/pages/elements/controllers/StlModelFiltersController.js` — new.
- `frontend/assets/js/components/resources/stl_model/pages/elements/helpers/StlModelFiltersHelper.jsx` — new.
- `frontend/assets/js/components/common/list_types/configs/stlModelListType.js` — `filtersComponent` wiring, array-aware `fetchStlModels`.
- Matching spec files for every file above.

## CI Checks

- `frontend`: `npm run coverage` (CI job: `jasmine`)
- `frontend`: `npm run lint` (CI job: `frontend-checks`)
- `frontend`: `npm run check_i18n` (CI job: `frontend-checks`) — relevant once the translator's keys land, see [translator.md](translator.md).

## Notes

- Open question to resolve during implementation: how a pre-selected `source`/`collection` id from the hash (just a number) gets turned into the `{id, name}` pair `MultiResourcePickerField` needs to render a badge — check whether `ResourcePickerSearch`/the resource API already supports a fetch-by-id lookup, or whether badges for hash-seeded resource picks need a distinct, minimal "id only, no name yet" rendering. `race`/`roles` don't have this problem since their names are derived purely from the constant value via `translateOption`.
- `MultiResourcePickerField`'s constant mode was built in #820 specifically anticipating reuse here (see its own JSDoc); no changes to that component are expected, only to how the filters bar seeds/reads its `value` prop.
