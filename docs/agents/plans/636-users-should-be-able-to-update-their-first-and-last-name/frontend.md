# Frontend Plan: Users should be able to update their first and last name

Main plan: [plan.md](plan.md)

## Shared contracts

See `plan.md`'s "Shared contracts" section. Summary:
- `AuthClient.fetchAccount`/`updateAccount` read/send `first_name`/`last_name` as snake_case keys, matching the backend's `MyAccountDetailSerializer`/`MyAccountUpdateSerializer` fields.
- Labels come from two new i18n keys the translator agent adds: `my_account_page.first_name_label`, `my_account_page.last_name_label`. The existing `my_account_page.name_label` key is reused as-is (its **value** changes from "Name" to "Username", but the key name and frontend reference to it are unchanged — no code change needed for that rename).

## Implementation Steps

### Step 1 — `AuthClient`
File: `frontend/assets/js/client/AuthClient.js`

Update `updateAccount` to send `first_name`/`last_name` alongside the existing fields:

```javascript
/**
 * Updates the authenticated user's own account details.
 *
 * @param {string} token - Authentication token for the requesting user.
 * @param {{name: string, firstName: string, lastName: string, email: string,
 *   password: (string|undefined), passwordConfirmation: (string|undefined)}} account -
 *   Account field values.
 * @returns {Promise<Response>} fetch response from the account endpoint.
 */
updateAccount(token, { name, firstName, lastName, email, password, passwordConfirmation }) {
  return this.patchJson('/users/account.json', token, {
    name,
    first_name: firstName,
    last_name: lastName,
    email,
    password,
    password_confirmation: passwordConfirmation,
  });
}
```

`fetchAccount` itself needs no change — it already returns the raw JSON response, which will now include `first_name`/`last_name` once the backend agent's change lands.

### Step 2 — `MyAccountController`
File: `frontend/assets/js/components/resources/account/pages/controllers/MyAccountController.js`

- Constructor: accept `setFirstName`/`setLastName` setters alongside `setName`/`setEmail`/`setAvatarUrl`.
- `#fetchAccount`: prefill via `safeSet(this.setFirstName, account.first_name ?? '')` and `safeSet(this.setLastName, account.last_name ?? '')`.
- `submitForm`: accept `firstName`/`lastName` in `formValues` and forward them to `this.client.updateAccount(token, formValues)` unchanged (the shape already matches `AuthClient.updateAccount`'s new destructured params).
- Update the JSDoc `@param` blocks for both the constructor and `submitForm` to include the two new fields.

### Step 3 — `MyAccount` page component
File: `frontend/assets/js/components/resources/account/pages/MyAccount.jsx`

- Add `firstName`/`lastName` state (`useState('')` each).
- Pass `setFirstName`/`setLastName` into `new MyAccountController(...)`.
- Include `firstName`/`lastName` in the `formValues` object passed to `controller.submitForm`.
- Pass `firstName`/`lastName` into `MyAccountHelper.render`'s `formState`, and add `onFirstNameChange`/`onLastNameChange` handlers (same pattern as `onNameChange`) to the `handlers` object.

### Step 4 — `MyAccountHelper`
File: `frontend/assets/js/components/resources/account/pages/helpers/MyAccountHelper.jsx`

Add two `FormField`s for First name and Last name, placed after the existing "Name" field (now relabeled to `my_account_page.name_label` → "Username") and before the Email field:

```jsx
<FormField
  id="my-account-first-name"
  type="text"
  label={Translator.t('my_account_page.first_name_label')}
  value={formState.firstName}
  onChange={handlers.onFirstNameChange}
  errors={formState.fieldErrors.first_name ?? []}
/>
<FormField
  id="my-account-last-name"
  type="text"
  label={Translator.t('my_account_page.last_name_label')}
  value={formState.lastName}
  onChange={handlers.onLastNameChange}
  errors={formState.fieldErrors.last_name ?? []}
/>
```

Update the `render` JSDoc `@param` types for `formState`/`handlers` to include `firstName`, `lastName`, `onFirstNameChange`, `onLastNameChange`.

No change needed to the existing "Name" `FormField` block itself — it keeps referencing `my_account_page.name_label`; only that key's translated value changes (translator agent's job).

### Step 5 — Specs
Files: `frontend/specs/assets/js/components/resources/account/pages/MyAccountSpec.js`, `frontend/specs/assets/js/client/AuthClient/updateAccountSpec.js`, `frontend/specs/assets/js/client/AuthClient/fetchAccountSpec.js`, plus a spec file for `MyAccountController` if one exists under `frontend/specs/assets/js/components/resources/account/pages/controllers/MyAccountController/`.

- `MyAccountSpec.js`: extend the `formState`/`handlers` fixtures in the "renders the account form" test with `firstName`, `lastName`, `onFirstNameChange`, `onLastNameChange`, and assert the rendered HTML contains the first/last name values (mirroring the existing `expect(html).toContain('value="Jane"')` assertion).
- `updateAccountSpec.js`: assert the PATCH body includes `first_name`/`last_name` when `firstName`/`lastName` are passed in.
- `fetchAccountSpec.js`: no change expected — it's a thin passthrough — but confirm the existing test doesn't hardcode an exhaustive response shape that would break.
- `MyAccountController` spec directory: add tests mirroring the existing name/email prefill and submit-forwarding tests, extended to `firstName`/`lastName`.

## Files to Change
- `frontend/assets/js/client/AuthClient.js`
- `frontend/assets/js/components/resources/account/pages/controllers/MyAccountController.js`
- `frontend/assets/js/components/resources/account/pages/MyAccount.jsx`
- `frontend/assets/js/components/resources/account/pages/helpers/MyAccountHelper.jsx`
- `frontend/specs/assets/js/components/resources/account/pages/MyAccountSpec.js`
- `frontend/specs/assets/js/client/AuthClient/updateAccountSpec.js`
- `frontend/specs/assets/js/components/resources/account/pages/controllers/MyAccountController/*` (whichever spec files already cover this controller)

## CI Checks
- `cd frontend && npm test`
- `cd frontend && npm run lint`

## Notes
- Do not rename the existing `name`/`onNameChange`/`setName` wiring — it still maps to the username field, just under a relabeled UI string. Only add new, parallel `firstName`/`lastName` wiring alongside it.
- Field IDs `my-account-first-name`/`my-account-last-name` follow the existing `my-account-<field>` convention used by `my-account-name`, `my-account-email`, etc.
