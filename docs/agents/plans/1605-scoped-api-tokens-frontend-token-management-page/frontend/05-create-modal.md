# Create modal with secret view

**`CreateApiTokenModal`** is a react-bootstrap `Modal`, with its markup in
`elements/helpers/CreateApiTokenModalHelper.jsx`. It has a small controller,
`elements/controllers/CreateApiTokenModalController.js`, that does the submit and copy work.

**Form view:**

- **Name:** trimmed, `maxLength=100`, with `FieldErrors` for `name`.
- The scope picker, games picker and expiry field from step 04.
- **Create button:** disabled until at least one scope is ticked, while submitting, and when
  `options` failed to load.
- **Submit:** calls `RequestStore.mutate({componentName: 'CreateApiTokenModal', resource:
  'apiToken', method: 'POST', quantityType: 'collection', body: {name, scopes, games:
  games.map(g => g.id), expires_at}})`.
  - **201:** read `.json()` and keep only `token` and the item name in React state, then switch
    to the secret view.
  - **400:** set the field errors from `data.errors` (as in `MyAccountController#handleFailure`).
  - **Anything else** (or a network error): show `generic_error` inside the modal and keep every
    form value so the user can retry.

**Secret view:**

- The modal is static: `backdrop="static"`, `keyboard={false}` and no close button.
- It shows the `secret_warning` and the full token in a read-only monospace `form-control` that
  selects its whole value on focus (`onFocus={e => e.target.select()}`).
- **Copy button:** calls `navigator.clipboard.writeText(token)`. On success it shows "Copied".
  On failure, or if `navigator.clipboard` is missing, it shows the visible `copy_failed`
  message.
- It shows the `usage_hint` (`Authorization: Bearer <token>` / `MAJORA_TOKEN=<token>`) and a Done
  button.
- **Done:** not gated on Copy and asks for no confirmation. It clears the secret and the form
  state, closes the modal and calls `onCreated()` so the page re-fetches the list.
- There is no `beforeunload` prompt.

The secret must never leave the modal state: no RequestStore write, no storage, no URL, no
`console`.

Specs:

- Create is disabled with no scope selected.
- The submit payload, including the expiry conversion and the game slugs.
- 201 switches to the secret view.
- 400 maps errors to the right fields, including `games` `max_length`.
- 5xx keeps the form values.
- Clipboard success and failure, and a missing `navigator.clipboard`.
- Done clears the secret and calls `onCreated`.
- The modal is static.

## Files to Change

- `frontend/assets/js/components/resources/account/pages/elements/CreateApiTokenModal.jsx` (new)
- `frontend/assets/js/components/resources/account/pages/elements/helpers/CreateApiTokenModalHelper.jsx`
  (new)
- `frontend/assets/js/components/resources/account/pages/elements/controllers/CreateApiTokenModalController.js`
  (new)
- the matching specs, with the controller specs split per method (new)
