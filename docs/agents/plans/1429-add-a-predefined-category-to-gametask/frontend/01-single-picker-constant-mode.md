# Fixed-list mode, errors and cancel for SingleResourcePickerField

`SingleResourcePickerField` only supports API mode (`resource`/`maxEntries`) today.
`MultiResourcePickerField` already takes a `picker` prop that is either
`{resource, maxEntries}` or `{values, translateOption}` (constant mode), and
`ResourcePickerSearch` already filters a fixed list in the browser by the translated `name`.
Bring the single picker to parity:

1. **`picker` prop:** replace the `resource`/`maxEntries` props with `picker`, the same shape as
   `MultiResourcePickerField`. `SingleResourcePickerFieldHelper` passes `resource`,
   `maxEntries`, `values` and `translateOption` through to `ResourcePickerSearch`.
2. **Value shape in constant mode:** `{id: value, name: translateOption(value)}`, the same as
   the multi picker. The picked badge shows `value.name`.
3. **`errors` prop (optional, default `[]`):** render `<FieldErrors errors={errors} />` under the
   field.
4. **Cancel re-picking:** while `searching` is true and a value is already picked, `Escape` in
   the search input or focus leaving the field (blur to outside the field's container) sets
   `searching` back to `false`, keeping `value`. Clicking a result must still select it before
   the blur closes the search: either select on `onMouseDown` (with `preventDefault`) in
   `ResourcePickerSearchHelper`'s result rows, or ignore a blur whose `relatedTarget` is inside
   the field's container. `ResourcePickerSearch` needs an optional `onCancel` prop (called on
   `Escape`), and it's cleanest to put the blur handling on the single picker's wrapper.
   Also auto-focus the search input when it is reopened from the badge, so click-away can
   close it.
5. **Update the caller:** `CollectionNewModalHelper.jsx` switches to
   `picker={{ resource: ..., maxEntries: ... }}`.

Specs:
- `SingleResourcePickerFieldSpec.js` and its helper spec: constant mode lists the translated
  values; typing filters them (e.g. "pint" with a pt `translateOption` finds "Pintura"); picking
  calls `onChange` with `{id, name}` and shows the badge; clicking the badge reopens the search;
  `Escape` and click-away close it and keep the value; clicking a result still selects it;
  `errors` render through `FieldErrors`; API mode still works.
- `ResourcePickerSearchSpec.js`: `onCancel` fires on `Escape`.
- Collection modal spec(s) still pass with the new `picker` prop.

## Files to Change
- `frontend/assets/js/components/common/forms/SingleResourcePickerField.jsx`: `picker` prop,
  `errors` prop, cancel handling.
- `frontend/assets/js/components/common/forms/helpers/SingleResourcePickerFieldHelper.jsx`: pass
  through constant mode, render errors, wrapper blur handling.
- `frontend/assets/js/components/common/forms/ResourcePickerSearch.jsx`: optional `onCancel`
  (Escape), optional autofocus.
- `frontend/assets/js/components/common/forms/helpers/ResourcePickerSearchHelper.jsx`: select on
  mousedown (or equivalent), Escape key handler.
- `frontend/assets/js/components/resources/collection/pages/elements/helpers/CollectionNewModalHelper.jsx`:
  use the `picker` prop.
- `frontend/specs/assets/js/components/common/forms/SingleResourcePickerFieldSpec.js`,
  `ResourcePickerSearchSpec.js`, `helpers/*` specs: the cases above.
