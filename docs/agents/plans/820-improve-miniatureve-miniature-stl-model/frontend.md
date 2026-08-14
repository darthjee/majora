# Frontend Plan: Improve miniature/stl_model

Main plan: [plan.md](plan.md)

## Shared contracts

Consumes the API surface backend produces (see [plan.md](plan.md)): create/update send and detail returns `url` (`string|null`), `size` (`string|null`), `races` (`string[]`), `roles` (`string[]`) — replacing today's singular `race`/`role`. The list endpoint is unchanged. Produces the i18n key requirements handed to [translator.md](translator.md).

## Implementation Steps

### Step 1 — Grow the enum constants

In `frontend/assets/js/components/resources/stl_model/stlModelEnums.js`:
- Extend `RACE_VALUES` to the full 29-value list, in the exact order/spelling of backend's grown `RACE_CHOICES` (existing 11 first, then the 18 new ones — see the issue for the list).
- Add `SIZE_VALUES = ['tiny', 'small', 'medium', 'huge', 'gargantuan', 'life']`, matching backend's `SIZE_CHOICES` order.
- `ROLE_VALUES` stays as-is (13 values, order unchanged) — only its usage becomes array-based.

### Step 2 — Generalize the picker component for constant-set search

`MultiResourcePickerField`/`ResourcePickerSearch` (`frontend/assets/js/components/common/forms/`) currently only search a backend resource via `RequestStore` (`fetchResourcePickerResults`). Races/roles are static, already-known-client-side constant lists — no backend call needed, just local substring filtering — and must reject anything outside the constant list (no "create new", unlike free-typed tags).

Add a **local-constant mode** alongside the existing API-search mode:
- `ResourcePickerSearch` (or a small new sibling component reusing `ResourcePickerSearchHelper.jsx`'s rendering) accepts an alternative `values`/`translateOption` prop pair instead of `resource`/`maxEntries`: when given, it filters `values` client-side by substring match against each value's translated label (via `translateOption`) rather than calling `fetchResourcePickerResults`, and only ever offers picks from within `values` — there is no equivalent of "create new" to guard against since the results list itself is already constrained, but confirm the results list truly excludes anything not in `values` (i.e. don't accidentally allow free-text submission of the raw search string).
- `MultiResourcePickerField` gains the equivalent prop-forwarding so it can render either mode; picked items in constant mode are shaped `{id: value, name: translateOption(value)}` (reusing the existing `{id, name}`-keyed `appendResourcePick`/`RemovableBadge` rendering as-is — `id` just becomes the raw constant string instead of a numeric resource id).

Keep both modes' public behavior (badges, remove button, dedup-by-id) identical — only the search/results source differs. Name the new prop(s) whatever reads clearest against the existing `resource`/`maxEntries` pair (e.g. `values`/`translateOption`); there's no established precedent to match here since this is the first constant-backed picker in the codebase.

### Step 3 — Wire the new/changed fields into the create and edit forms

`frontend/assets/js/components/resources/stl_model/pages/helpers/StlModelNewHelper.jsx` and `StlModelEditHelper.jsx` (they currently share the same `type`/`race`/`role` `EnumSelectField` trio via near-identical `#renderEnumFields`):
- Replace the single-select `race`/`role` `EnumSelectField`s with the new constant-mode picker from Step 2, bound to `RACE_VALUES`/`ROLE_VALUES`, producing `formState.races`/`formState.roles` arrays instead of `formState.race`/`formState.role` strings.
- Add a `url` field (`FormField` type `"url"` or `"text"`, matching `name`'s pattern) and a `size` field (`EnumSelectField` over `SIZE_VALUES`, `nullable` with a none-option — same shape as the current `race`/`role` selects before this change).
- `StlModelNewHelper.jsx` only: no other structural changes (photo/tags/source/collection pickers untouched).

### Step 4 — Controllers: update the request body shape

`StlModelNewController.js` (`#performCreate`) and `StlModelEditController.js` (`submitForm`):
- Replace `race: formValues.race || null, role: formValues.role || null` with `url: formValues.url || null, size: formValues.size || null, races: formValues.races ?? [], roles: formValues.roles ?? []` in the request body sent via `RequestStore.mutate`.
- Update the JSDoc `@param` shapes for `formValues` accordingly (both controllers currently document `race: string, role: string` — becomes `url: string, size: string, races: string[], roles: string[]`).

### Step 5 — Show page

`StlModelHelper.jsx`:
- Replace `#renderEnumField('race', stlModel.race)` / `#renderEnumField('role', stlModel.role)` (single-value renderers) with array renderers for `races`/`roles` — following `#renderTags`'s existing badge-list pattern (translate each entry via `stl_model_page.race_<value>`/`role_<value>`, same as the picker does) rather than the current "single translated value or none" `#renderEnumField` shape.
- Add a `url` renderer — a clickable external link (`target="_blank" rel="noreferrer"`, same as `#renderLinks`'s link rendering) shown only when `stlModel.url` is set.
- Add a `size` renderer — same shape as the current (soon-to-be-removed) single-value `#renderEnumField`, translating via `stl_model_page.size_<value>`.
- Update the JSDoc `@param` block for `stlModel` (currently documents `race: string|null`, `role: string|null`) to reflect `url: string|null`, `size: string|null`, `races: string[]`, `roles: string[]`.

### Step 6 — Tests

Update/extend the existing Jasmine specs mirroring each changed file above (under `frontend/specs/`, following the existing `stl_model`-related spec tree) — `StlModelNewHelper`, `StlModelEditHelper`, `StlModelHelper`, `StlModelNewController`, `StlModelEditController`, `stlModelEnums`, and the picker component(s) touched in Step 2. Cover: the new constant-picker mode's filtering/rejection behavior, the grown `RACE_VALUES`/new `SIZE_VALUES` lists, request bodies now carrying `url`/`size`/`races`/`roles`, and the show page's new array/url/size rendering.

## Files to Change

- `frontend/assets/js/components/resources/stl_model/stlModelEnums.js` — grow `RACE_VALUES`, add `SIZE_VALUES`.
- `frontend/assets/js/components/common/forms/ResourcePickerSearch.jsx` — local-constant search mode.
- `frontend/assets/js/components/common/forms/MultiResourcePickerField.jsx` — forward the new mode's props.
- `frontend/assets/js/components/common/forms/helpers/ResourcePickerSearchHelper.jsx` — verify it still renders correctly for the constant-mode results shape.
- `frontend/assets/js/components/resources/stl_model/pages/helpers/StlModelNewHelper.jsx` — races/roles picker, url, size fields.
- `frontend/assets/js/components/resources/stl_model/pages/helpers/StlModelEditHelper.jsx` — same field set as above.
- `frontend/assets/js/components/resources/stl_model/pages/helpers/StlModelHelper.jsx` — show page: races/roles/url/size rendering.
- `frontend/assets/js/components/resources/stl_model/pages/controllers/StlModelNewController.js` — request body shape.
- `frontend/assets/js/components/resources/stl_model/pages/controllers/StlModelEditController.js` — request body shape.
- Corresponding spec files under `frontend/specs/` for every file above.

## CI Checks

- `frontend`: `docker-compose run --rm majora_fe npm run coverage` (CI job: `jasmine`)
- `frontend`: `docker-compose run --rm majora_fe npm run lint` (CI job: `frontend-checks`)
- `frontend`: `docker-compose run --rm majora_fe npm run check_i18n` (CI job: `frontend-checks`) — will fail until [translator.md](translator.md)'s keys land in both `en`/`pt`.

## Notes

- Once Step 2/3's exact prop and i18n key names are settled, report the final key list back into [translator.md](translator.md)'s expectations — the plan's best guess at key names may not match what's actually implemented.
- `StlModelEditHelper.jsx`/`StlModelNewHelper.jsx` currently share near-duplicate `#renderEnumFields` methods; consider (but don't block on) whether the new picker/url/size fields are a good moment to extract a shared helper, matching the existing "shared field pieces reused verbatim" comment already in `StlModelEditHelper.jsx`'s docstring.
