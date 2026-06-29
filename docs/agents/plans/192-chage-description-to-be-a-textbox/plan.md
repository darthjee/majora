# Plan: Change description to be a textbox

Issue: [192-chage-description-to-be-a-textbox.md](../issues/192-chage-description-to-be-a-textbox.md)

## Overview

Change both character description fields (`public_description` and `private_description`) from single-line text inputs to multi-line textareas on the edit form, and display them inside a visually distinct styled container on the show page.

## Context

`Character` already stores both description fields as `TextField` in the database. The edit form currently renders them with `<FormField type="text">` (single-line `<input>`), and the show page renders them as plain `<p>` tags. This plan introduces a new `TextareaField` component and updates the edit helper and show helpers accordingly.

## Implementation Steps

### Step 1 — Create `TextareaField` component

Create `frontend/assets/js/components/elements/TextareaField.jsx` modelled on `FormField.jsx`, but rendering a `<textarea className="form-control">` instead of an `<input>`. The component accepts `id`, `label`, `value`, `onChange`, and `errors = []` props (no `type` prop needed).

### Step 2 — Add `TextareaField` spec

Create `frontend/specs/assets/js/components/elements/TextareaFieldSpec.js` following the same pattern as `FormFieldSpec.js`. Verify: label linked via `htmlFor`/`id`, value rendered as textarea text content, `mb-3`/`form-control` classes present, errors rendered per message, no error container when errors is empty.

### Step 3 — Update `BaseCharacterEditHelper` to use `TextareaField`

In `BaseCharacterEditHelper.jsx`:
- Import `TextareaField` from `../../elements/TextareaField.jsx`.
- Replace the `<FormField type="text" ...>` for `description` (id `${idPrefix}-edit-description`) with `<TextareaField>`.
- Replace the `<FormField type="text" ...>` for `privateDescription` (id `${idPrefix}-edit-private-description`) with `<TextareaField>`.

### Step 4 — Update `BaseCharacterEditHelperSpec`

In `BaseCharacterEditHelperSpec.js`, the assertion `expect(html).toContain('value="DM notes."')` will fail because `<textarea>` renders its value as child text content, not a `value=""` attribute. Change it to `expect(html).toContain('>DM notes.<')` (or simply `.toContain('DM notes.')` if no ambiguity). Similarly update any assertion that relied on `value="A brave warrior."` for the description field, if present.

### Step 5 — Style the description on the show page (`CharacterInfoHelper`)

In `CharacterInfoHelper.jsx`, change `#renderDescription` to wrap the text in a visually distinct container, e.g.:

```jsx
return <div className="mt-3 p-3 border rounded bg-light">{description}</div>;
```

The existing spec checks `not.toContain('mt-3')` when description is empty — this remains valid because the method still returns `null` when description is falsy. Update `CharacterInfoHelperSpec.js` to also verify the styled container (e.g. `toContain('border')`) when a description is present.

### Step 6 — Style the private description on the show page (`CharacterHelper`)

In `CharacterHelper.jsx`, change `#renderPrivateDescription` to render the `privateDescription` text inside a styled `<div>` instead of a plain `<p>`, e.g.:

```jsx
<div className="mt-4">
  <h5>{Translator.t('character_full_page.private_description_label')}</h5>
  <div className="p-3 border rounded bg-light">{privateDescription}</div>
</div>
```

No spec changes needed here — the existing tests only assert on text content (the string `'Secret DM notes.'`) and the `'DM Notes'` label.

## Files to Change

- `frontend/assets/js/components/elements/TextareaField.jsx` — new component (textarea with label and errors)
- `frontend/specs/assets/js/components/elements/TextareaFieldSpec.js` — new spec for `TextareaField`
- `frontend/assets/js/components/pages/helpers/BaseCharacterEditHelper.jsx` — import and use `TextareaField` for both description fields
- `frontend/specs/assets/js/components/pages/helpers/BaseCharacterEditHelperSpec.js` — update textarea value assertions
- `frontend/assets/js/components/elements/helpers/CharacterInfoHelper.jsx` — styled container for description on show page
- `frontend/specs/assets/js/components/elements/helpers/CharacterInfoHelperSpec.js` — verify styled container for description
- `frontend/assets/js/components/pages/helpers/CharacterHelper.jsx` — styled container for private description on show page

## CI Checks

- `frontend/`: `docker-compose run --rm vite yarn test` (CI job: `jasmine`)
- `frontend/`: `docker-compose run --rm vite yarn lint` (CI job: `frontend-checks`)

## Notes

- `<textarea>` renders value as child text content in React's `renderToStaticMarkup`, not as a `value=""` attribute — test assertions must account for this.
- The existing `CharacterInfoHelperSpec` test `not.toContain('mt-3')` when description is empty continues to pass as long as `null` is returned for an absent description.
- No backend changes, no new translation keys, and no Navi/infra changes are required.
