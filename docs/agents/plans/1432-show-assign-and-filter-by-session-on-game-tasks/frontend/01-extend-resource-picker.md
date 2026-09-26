# Extend the resource picker (params + clear)

Two optional, backward-compatible extensions:

1. **Path params.** `fetchResourcePickerResults({ resource, maxEntries, searchTerm, params })` forwards `params` (default `{}`) to `RequestStore.ensure`. `SingleResourcePickerField` / `ResourcePickerSearch` (and `MultiResourcePickerField`, if it shares the code path) pass `picker.params` through. This lets game-scoped resources like `session` resolve `/games/${gameSlug}/...`.
2. **Clear affordance.** `SingleResourcePickerField` accepts an optional `onClear` prop. When it is given and `value` is non-null, `SingleResourcePickerFieldHelper` renders a small clear button (`×`, `aria-label`/title `resource_picker.clear`) next to the picked badge. Clicking it calls `onClear()` without reopening the search. Without `onClear`, the field renders exactly as today. Update the component's JSDoc, which currently says there is no clear affordance.

Specs: `params` reaches `RequestStore.ensure`; the clear button renders only with `onClear` and a value, and calls `onClear` when clicked; existing picker specs still pass.

## Files to Change
- `frontend/assets/js/components/common/forms/ResourcePickerSearch.jsx` — forward `params`.
- `frontend/assets/js/components/common/forms/SingleResourcePickerField.jsx` — `picker.params` passthrough, `onClear` prop.
- `frontend/assets/js/components/common/forms/helpers/SingleResourcePickerFieldHelper.jsx` — render the clear button.
- `frontend/assets/js/components/common/forms/helpers/ResourcePickerSearchHelper.jsx` — only if it is what calls the fetch.
- Corresponding specs under `frontend/specs/...`.
