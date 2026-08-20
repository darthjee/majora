# MyAccountHelper.jsx: FIELD_REGISTRY for the form fields

`MyAccountHelper.render` (`frontend/assets/js/components/resources/account/pages/helpers/MyAccountHelper.jsx`, currently 63 NLOC, CCN 15) is 7 near-identical `<FormField>` blocks (`name`, `display_name`, `first_name`, `last_name`, `email`, `password`, `password_confirmation`), each differing only by `id`/`type`/label translation key/`formState` value key/handler key/`fieldErrors` key, plus the 7 repeated `formState.fieldErrors.X ?? []` chains that inflate the CCN.

Adopt the same config-driven registry shape `AUTH_CONTROL_REGISTRY` used in #1186 (`frontend/assets/js/components/common/header/helpers/HeaderHelper.jsx`): a module-level `FIELD_REGISTRY` array of entries:

```js
{ id: 'my-account-name', type: 'text', labelKey: 'my_account_page.name_label', valueKey: 'name', onChangeKey: 'onNameChange', errorKey: 'name' }
```

one per field, in the current visual order. `render` collapses its 7 `<FormField>` blocks into `FIELD_REGISTRY.map((entry) => <FormField key={entry.id} id={entry.id} type={entry.type} label={Translator.t(entry.labelKey)} value={formState[entry.valueKey]} onChange={handlers[entry.onChangeKey]} errors={formState.fieldErrors[entry.errorKey] ?? []} />)`. The avatar, `<h1>` heading, `#renderError(formState)` call, and `<SubmitButton>` stay outside the registry as unconditional markup, mirroring `HeaderHelper.render`'s brand/modals staying outside `AUTH_CONTROL_REGISTRY`.

## Files to Change

- `frontend/assets/js/components/resources/account/pages/helpers/MyAccountHelper.jsx` — add `FIELD_REGISTRY` (exported, same as `AUTH_CONTROL_REGISTRY`, so a spec can assert `id` uniqueness directly); replace the 7 inline `<FormField>` blocks in `render` with the `.map()` above.
- `frontend/specs/assets/js/components/resources/account/pages/helpers/MyAccountHelperSpec.js` — no assertion changes expected (rendered-output regression signal, all 9 existing `it` blocks should keep passing unmodified); re-run to confirm.
- `frontend/specs/assets/js/components/resources/account/pages/helpers/MyAccountHelper/fieldRegistrySpec.js` (new) — `FIELD_REGISTRY` id-uniqueness, mirroring `frontend/specs/assets/js/components/common/header/helpers/HeaderHelper/registrySpec.js`'s `AUTH_CONTROL_REGISTRY` uniqueness test (`expect(new Set(ids).size).toBe(ids.length)`).
