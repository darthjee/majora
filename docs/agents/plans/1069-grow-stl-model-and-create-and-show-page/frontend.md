# Frontend Plan: Grow STL model and create and show page

Main plan: [plan.md](plan.md)

## Shared contracts

Consumes the field/value list and API surface from [plan.md](plan.md)'s "Shared contracts"
section (backend's job) and the i18n keys from [translator.md](translator.md) (translator's job).
This plan can be implemented in parallel with both — the field names/values and key names are
fixed up front, so no blocking dependency, only final wiring needs the same names to match.

## Implementation Steps

### Step 1 — New `SwitchField` common component

No bootstrap-switch component exists yet (`FormField.jsx` only renders a plain `<input>`). Add
`frontend/assets/js/components/common/forms/SwitchField.jsx`:

```jsx
export default function SwitchField({ id, label, checked, onChange }) {
  return (
    <div className="form-check form-switch mb-3">
      <input
        id={id} type="checkbox" role="switch" className="form-check-input"
        checked={checked} onChange={onChange}
      />
      <label htmlFor={id} className="form-check-label">{label}</label>
    </div>
  );
}
```

Used for the `owned` field. No field-errors slot needed (booleans don't fail validation).

### Step 2 — New `EnumSelectField` common component

`type`/`race`/`role` are three near-identical dropdowns (hardcoded options, i18n-keyed labels).
Rather than copy-pasting `GameTypeSelect.jsx`'s shape three times, add one reusable component,
`frontend/assets/js/components/common/forms/EnumSelectField.jsx`:

```jsx
/**
 * @param {object} props
 * @param {string} props.id
 * @param {string} props.label
 * @param {string[]} props.values - Ordered list of raw `db_value`s (no blank option baked in).
 * @param {Function} props.translateOption - `(value) => label string` for each option.
 * @param {string} props.value - Currently selected value, or `''` for the nullable blank option.
 * @param {boolean} [props.nullable] - When true, renders a leading blank option mapping to `''`.
 * @param {string} [props.noneLabel] - Label for the blank option (required when `nullable`).
 * @param {Function} props.onChange
 */
export default function EnumSelectField({
  id, label, values, translateOption, value, nullable = false, noneLabel, onChange,
}) {
  return (
    <div className="mb-3">
      <label htmlFor={id} className="form-label">{label}</label>
      <select id={id} className="form-select" value={value} onChange={onChange}>
        {nullable && <option value="">{noneLabel}</option>}
        {values.map((v) => <option key={v} value={v}>{translateOption(v)}</option>)}
      </select>
    </div>
  );
}
```

Send `race`/`role` as `null` (not `''`) in the request body when the blank option is selected —
convert at the controller's submit boundary, not in this component.

### Step 3 — STL model field value constants

New file `frontend/assets/js/components/resources/stl_model/stlModelEnums.js` holding the ordered
`db_value` arrays for `type`/`race`/`role`, copied verbatim from plan.md's table (this is the
frontend half of the shared-values contract — must match backend's `TYPE_CHOICES`/`RACE_CHOICES`/
`ROLE_CHOICES` order and spelling exactly):

```js
export const TYPE_VALUES = ['terrain', 'prop', 'creature', 'other'];
export const RACE_VALUES = ['human', 'elf', 'dwarf', 'halfling', 'gnome', 'half-elf', 'half-orc', 'tiefling', 'dragonborn', 'orc', 'goblin'];
export const ROLE_VALUES = ['barbarian', 'bard', 'cleric', 'druid', 'fighter', 'monk', 'paladin', 'ranger', 'rogue', 'sorcerer', 'warlock', 'wizard', 'archer'];
```

Both the new/edit form pages and the show page import these (for the `<select>` options and for
iterating when rendering a translated label).

### Step 4 — `resourceConfig`: add `PATCH.single`

Edit `frontend/assets/js/utils/requests/config/stlModelConfig.js`, adding (mirroring
`gameConfig.js`'s `PATCH.single` shape):

```js
const patch = { path: ({ id }) => `/miniatures/stl_models/${id}.json`, permission: null };
// ...
export default {
  GET: { ... },
  POST: { ... },
  PATCH: {
    single: { regular: patch, private: patch },
  },
};
```

### Step 5 — Full create page (replaces the modal)

Following `GameNew.jsx`/`GameNewHelper.jsx`/`GameNewController.js`'s page (not modal) shape:

- New `frontend/assets/js/components/resources/stl_model/pages/StlModelNew.jsx` — page component,
  owns form state for `name`, `tags`, `sources`, `collections`, `photoFile` (all carried over
  as-is from `StlModelNewModal.jsx`'s state shape) plus new `owned` (default `true`), `type`
  (default `''`, required before submit), `race`/`role` (default `''` → `null`).
- New `frontend/assets/js/components/resources/stl_model/pages/helpers/StlModelNewHelper.jsx` —
  renders the page (not `Modal`/`Modal.Body`/`Modal.Footer` — a plain `container` layout like
  `GameNewHelper.jsx`/`StlModelHelper.jsx`'s show-page shell), reusing `StlModelPhotoField`,
  `FormField`, `TagsField`, `MultiResourcePickerField` from the current modal helper verbatim, plus
  the new `SwitchField` (`owned`) and three `EnumSelectField`s (`type` not nullable, `race`/`role`
  nullable) from Steps 1–2.
- `frontend/assets/js/components/resources/stl_model/pages/controllers/StlModelNewController.js` —
  reuse the existing controller's create-then-upload-photo saga logic almost unchanged; extend
  `#performCreate`'s request body with `owned`, `type`, `race: race || null`, `role: role || null`.
  On success, navigate to `#/miniatures/stl_models/${id}` (mirroring `GameNewController`'s
  redirect-on-success — the old pre-modal `StlModelNew.jsx`, recoverable via
  `git show 7cf08c12^:frontend/assets/js/components/resources/stl_model/pages/StlModelNew.jsx`,
  did exactly this before it was turned into a modal) instead of calling an `onSuccess` prop (no
  caller-owned modal state anymore).
- Delete `pages/elements/StlModelNewModal.jsx`, `pages/elements/helpers/StlModelNewModalHelper.jsx`,
  and their specs (`StlModelNewModalSpec.js`, `StlModelNewModalHelperSpec.js`).
  `StlModelNewController.js` moves from `pages/controllers/` — check whether it needs to move out
  of `elements/` first; it already lives at `pages/controllers/StlModelNewController.js` (not
  under `elements/`), so no move needed, only its internal logic changes.

### Step 6 — Edit page

Following `GameEdit.jsx`/`GameEditHelper.jsx`/`GameEditController.js`'s shape:

- New `frontend/assets/js/components/resources/stl_model/pages/StlModelEdit.jsx` — loads the
  existing STL model via `RequestStore.ensure` (same `GET /miniatures/stl_models/:id.json` the
  show page already uses), seeds form state from it, same field set as the new page.
- New `frontend/assets/js/components/resources/stl_model/pages/helpers/StlModelEditHelper.jsx` —
  same field layout as `StlModelNewHelper.jsx` (share sub-pieces where reasonable, e.g. both could
  render a common `<StlModelFormFields ... />` if the duplication feels excessive — use judgment
  during implementation, `Game`'s New/Edit pair does not share such a component today so
  duplication is the established precedent, not a smell).
- New `frontend/assets/js/components/resources/stl_model/pages/controllers/StlModelEditController.js`
  extending `BaseEditController` (mirrors `GameEditController.js`): `loadResource` fetches the STL
  model by id; `submitForm` sends a `PATCH` via `RequestStore.mutate` with
  `{ name, owned, type, race, role }` (photo/tags/sources/collections not editable from this page,
  per plan.md's API surface — only the photo upload endpoint changes the photo, unchanged from
  today), then navigates back to the show page on success.
- No photo/tags/sources/collections editing on this page — matches the update endpoint's accepted
  field set exactly (see plan.md).

### Step 7 — Show page updates

Edit `StlModelHelper.jsx`/`StlModel.jsx`:
- Render `owned` (e.g. a badge/checkmark using the `owned_label`/`not_owned_label` i18n keys),
  `type` (`Translator.t('stl_model_page.type_' + stlModel.type)`), `race`/`role` (same pattern,
  or `Translator.t('stl_model_page.none_label')` when `null`).
- Add an "Edit" link/button (`href="#/miniatures/stl_models/${id}/edit"`), gated on
  `isStaffOrSuperUser` (the page already resolves this via `useStaffOrSuperUser()` for the photo
  upload gate — reuse the same flag).

### Step 8 — List page: modal → link

Edit `StlModels.jsx`/`StlModelsHelper.jsx`: remove `showNewModal` state and `<StlModelNewModal>`;
`StlModelsHelper`'s "New STL model" button becomes a plain `<a href="#/miniatures/stl_models/new">`
(styled the same, `btn btn-primary`), still gated on `isStaffOrSuperUser`. No `refreshToken`/
`onSuccess` plumbing needed anymore (that only existed to close the modal and refresh the list
in place — a real page navigation reloads the list naturally on return).

### Step 9 — Routing and page registration

`frontend/assets/js/utils/routing/HashRouteResolver.js`: add, near the existing `stl_models`
entries:
```js
['/miniatures/stl_models/new', 'stlModelNew'],
['/miniatures/stl_models/:id/edit', 'stlModelEdit'],
```
Order matters — `:id/edit` and `:id` (existing `stlModel` route) must not shadow `new`; check
against how `HashRouteResolver.js` already disambiguates `/games/new` vs `/games/:game_slug`
elsewhere in the same file and follow the same ordering convention.

`frontend/assets/js/components/helpers/AppHelper.jsx`: import `StlModelNew`/`StlModelEdit`, add
`stlModelNew: <StlModelNew />, stlModelEdit: <StlModelEdit />` to the page-key map.

### Step 10 — `StlModelController.js` doc comment

Its class doc currently says "no write endpoint exists for `stl_models` at all" — update once the
`PATCH` endpoint exists (comment only; the show-page controller's own logic doesn't change, it
still only does a `GET`).

## Files to Change

- `frontend/assets/js/components/common/forms/SwitchField.jsx` — new.
- `frontend/assets/js/components/common/forms/EnumSelectField.jsx` — new.
- `frontend/assets/js/components/resources/stl_model/stlModelEnums.js` — new.
- `frontend/assets/js/utils/requests/config/stlModelConfig.js` — add `PATCH.single`.
- `frontend/assets/js/components/resources/stl_model/pages/StlModelNew.jsx` — new (page, not modal).
- `frontend/assets/js/components/resources/stl_model/pages/helpers/StlModelNewHelper.jsx` — new.
- `frontend/assets/js/components/resources/stl_model/pages/controllers/StlModelNewController.js` — rewritten for page-redirect flow + new fields.
- `frontend/assets/js/components/resources/stl_model/pages/StlModelEdit.jsx` — new.
- `frontend/assets/js/components/resources/stl_model/pages/helpers/StlModelEditHelper.jsx` — new.
- `frontend/assets/js/components/resources/stl_model/pages/controllers/StlModelEditController.js` — new.
- `frontend/assets/js/components/resources/stl_model/pages/helpers/StlModelHelper.jsx` — new fields + Edit link.
- `frontend/assets/js/components/resources/stl_model/pages/StlModels.jsx`,
  `pages/helpers/StlModelsHelper.jsx` — modal → link.
- `frontend/assets/js/components/resources/stl_model/pages/controllers/StlModelController.js` — doc comment.
- `frontend/assets/js/utils/routing/HashRouteResolver.js` — new routes.
- `frontend/assets/js/components/helpers/AppHelper.jsx` — new page-key entries.
- Deleted: `pages/elements/StlModelNewModal.jsx`, `pages/elements/helpers/StlModelNewModalHelper.jsx`.

## Tests

- Delete `StlModelNewModalSpec.js`, `StlModelNewModalHelperSpec.js` (modal removed).
- New specs mirroring the deleted ones' coverage, for `StlModelNewSpec.js`,
  `StlModelNewHelperSpec.js`, `StlModelEditSpec.js`, `StlModelEditHelperSpec.js`,
  `StlModelEditControllerSpec.js`, plus updates to the existing
  `StlModelNewController` spec directory, `StlModelHelperSpec.js` (new fields + Edit link),
  `StlModelsHelperSpec.js` (link instead of modal trigger), and new
  `SwitchFieldSpec.js`/`EnumSelectFieldSpec.js` under `frontend/specs/.../common/forms/`.
- `HashRouteResolverSpec.js` (if it exists) — new route entries resolve to the right page keys.

## CI Checks

- `frontend`: `docker-compose run --rm majora_fe npm run coverage` (CI job `jasmine`)
- `frontend`: `docker-compose run --rm majora_fe yarn lint` (CI job `frontend-checks`)

## Notes

- `EnumSelectField`/`SwitchField` are new shared components — check for naming collisions/near-
  duplicates in `common/forms/` before adding (only `PollTypeRadioGroup.jsx` was found as a
  similar existing enum-ish input during planning; no direct overlap).
- Confirm during implementation whether `race`/`role`'s blank-option value should be `''` (matches
  `<select>`'s native semantics, simplest) vs. some sentinel — `''` is assumed above and converted
  to `null` only at the request-body boundary.
