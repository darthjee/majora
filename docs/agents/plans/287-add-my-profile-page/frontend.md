# Frontend Plan: Add my profile page

Main plan: [plan.md](plan.md)

## Shared contracts

- Backend exposes (see [backend.md](backend.md)):
  - `GET /users/account.json` → `200` `{"name": <string>, "email": <string>}` (authenticated).
  - `PATCH /users/account.json` body `{"name", "email", "password"?,
    "password_confirmation"?}` → `200` with the same shape on success; `400`
    `{"errors": {...}}` on validation failure; `401` unauthenticated. Both calls use
    `Authorization: Token <token>`, same as `AuthClient.sendTestEmail`/`setLanguagePreference`.
  - `name`/`email` are always required in the `PATCH` body; `password`/`password_confirmation`
    may both be omitted/blank (no change) or both provided and matching.

## Implementation Steps

### Step 1 — Client methods

In `frontend/assets/js/client/AuthClient.js`, add two methods next to
`setLanguagePreference`:

```js
fetchAccount(token) {
  return this.request('/users/account.json', {
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Token ${token}` } : {}),
    },
  });
}

updateAccount(token, { name, email, password, passwordConfirmation }) {
  return this.request('/users/account.json', {
    method: 'PATCH',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Token ${token}` } : {}),
    },
    body: JSON.stringify({
      name,
      email,
      password,
      password_confirmation: passwordConfirmation,
    }),
  });
}
```

### Step 2 — New icon asset

Add a small icon-only asset for the header button, e.g.
`frontend/assets/images/my_account.svg` (a plain hand-written SVG is simplest to author
directly, no image-editing tooling required — Vite serves/imports `.svg` as a URL by default,
same as the existing `.png` assets). Keep it visually simple (e.g. a basic user/profile glyph)
consistent with the other placeholder assets in that folder.

### Step 3 — Header button

In `frontend/assets/js/components/elements/helpers/HeaderHelper.jsx`:
- Import the new asset the same way `CardAvatar` imports `defaultCharacterPhoto`:
  `import myAccountIcon from '../../../images/my_account.svg';`.
- In `#renderAuthControl`, inside the `state.loggedIn` branch, add a new icon-only link/button
  alongside the existing Logoff/send-test-email controls:
  ```jsx
  <Nav.Link href="#/my_account" data-testid="my-account-link">
    <img src={myAccountIcon} alt={Translator.t('header.my_account_alt')} />
  </Nav.Link>
  ```
- Add the `my_account_alt` key under `header:` in every `frontend/assets/i18n/*.yaml` file
  (e.g. `My account` / translated equivalents) — since this touches translation files across
  every language, hand this specific sub-step to the `translator` agent to keep key-parity
  correct rather than guessing at every language's YAML.

No `HeaderController`/`Header.jsx` changes are needed for the button itself — it is a plain
navigation link, not a stateful control (unlike Login/Logoff).

### Step 4 — Route registration

In `frontend/assets/js/utils/HashRouteResolver.js`, register the new route (near
`'/users/register'`):

```js
this.#router.register('/my_account', 'myAccount');
```

### Step 5 — `MyAccount` page (Component/Controller/Helper split)

Follow the `Register.jsx` / `RegisterController.js` / `RegisterHelper.jsx` split, but closer in
shape to `StaffUserEdit.jsx` / `StaffUserEditController.js` / `StaffUserEditHelper.jsx` since
this page needs an initial `GET` fetch to prefill the form plus field-level errors:

- `frontend/assets/js/components/pages/MyAccount.jsx`:
  - State: `name`, `email`, `password`, `passwordConfirmation`, `loading`, `error`,
    `fieldErrors`, `status` (`'idle' | 'submitting' | 'error'`).
  - `useEffect(() => controller.buildEffect()(), [controller])` fetches the account via
    `AuthClient.fetchAccount` (using `AuthStorage.getToken()`); on `401`/failure, redirect to
    `#/` (mirrors `StaffUserEditController.buildEffect`'s guard-redirect pattern); on success,
    populate `name`/`email` from the response (leave `password`/`passwordConfirmation` blank).
  - `handleSubmit` prevents default, then calls
    `controller.submitForm(event, { name, email, password, passwordConfirmation }, {
    setStatus, setFieldErrors })`.
- `frontend/assets/js/components/pages/controllers/MyAccountController.js`:
  - `buildEffect()` — fetches the account, redirects to `#/` on `401`/any failure (no separate
    "not logged in" page needed — this mirrors `AdminAccess`-guarded pages redirecting away).
  - `submitForm(event, formValues, setters)` — calls `AuthClient.updateAccount`; on `200`, no
    redirect is required by the issue (stay on the page — optionally show a brief success state
    via `setStatus('success')` if useful, but not required); on `400`, sets `fieldErrors` from
    `data.errors`; on other failures, `setStatus('error')`.
- `frontend/assets/js/components/pages/helpers/MyAccountHelper.jsx`:
  - Reuse `FormField` (with `errors={formState.fieldErrors.<field> ?? []}`), `ErrorAlert`, and
    `SubmitButton`, exactly like `StaffUserEditHelper`.
  - Fields: name, email, password, password confirmation — all four visible always; password
    fields are simply left blank to mean "no change".
  - `renderLoading()` — a simple loading message (mirrors `StaffUserEditHelper.renderLoading`).

### Step 6 — Wire into `AppHelper`

In `frontend/assets/js/components/helpers/AppHelper.jsx`:
- `import MyAccount from '../pages/MyAccount.jsx';`
- Add `myAccount: <MyAccount />,` to the `PAGES` map.

### Step 7 — Translations

Add a new `my_account_page:` block to every `frontend/assets/i18n/*.yaml` file (English content
first, e.g. `title`, `name_label`, `email_label`, `password_label`,
`password_confirmation_label`, `submit`, `error`), matching the shape of `register_page`/
`staff_user_edit_page`. As with the header alt text in Step 3, delegate the actual multi-language
content and key-parity verification (`npm run check_i18n`) to the `translator` agent.

### Step 8 — Specs

- `frontend/specs/assets/js/client/AuthClientSpec.js` — cases for `fetchAccount`/
  `updateAccount` (method, URL, headers, body).
- `frontend/specs/assets/js/components/elements/helpers/HeaderHelperSpec.js` — the new
  `my-account-link` renders (with correct `href`) only when `loggedIn` is true, and is absent
  when logged out.
- `frontend/specs/assets/js/utils/HashRouteResolverSpec.js` — `/my_account` resolves to
  `myAccount`.
- New `frontend/specs/assets/js/components/pages/MyAccountSpec.js`,
  `controllers/MyAccountControllerSpec.js`, and `helpers/MyAccountHelperSpec.js`, mirroring the
  `StaffUserEdit*Spec.js` files: prefill from the `GET` response, redirect-away on fetch
  failure/`401`, successful submit, `400` field errors, generic error status.
- `frontend/specs/assets/js/components/helpers/AppHelperSpec.js` — `myAccount` page key renders
  `MyAccount`.

## Files to Change

- `frontend/assets/js/client/AuthClient.js` — add `fetchAccount`/`updateAccount`
- `frontend/assets/images/my_account.svg` — new icon asset
- `frontend/assets/js/components/elements/helpers/HeaderHelper.jsx` — new header link
- `frontend/assets/js/utils/HashRouteResolver.js` — register `/my_account`
- `frontend/assets/js/components/pages/MyAccount.jsx` — new page
- `frontend/assets/js/components/pages/controllers/MyAccountController.js` — new controller
- `frontend/assets/js/components/pages/helpers/MyAccountHelper.jsx` — new helper
- `frontend/assets/js/components/helpers/AppHelper.jsx` — register the new page
- `frontend/assets/i18n/*.yaml` — new `header.my_account_alt` key and `my_account_page` block
  (all languages; delegate to `translator`)
- `frontend/specs/assets/js/client/AuthClientSpec.js` — new cases
- `frontend/specs/assets/js/components/elements/helpers/HeaderHelperSpec.js` — new cases
- `frontend/specs/assets/js/utils/HashRouteResolverSpec.js` — new case
- `frontend/specs/assets/js/components/pages/MyAccountSpec.js` — new spec
- `frontend/specs/assets/js/components/pages/controllers/MyAccountControllerSpec.js` — new spec
- `frontend/specs/assets/js/components/pages/helpers/MyAccountHelperSpec.js` — new spec
- `frontend/specs/assets/js/components/helpers/AppHelperSpec.js` — new case

## CI Checks

- `frontend`: `docker-compose run majora_fe npm run coverage` (CI job: `jasmine`)
- `frontend`: `docker-compose run majora_fe npm run lint` (CI job: `frontend-checks`)
- `frontend`: `docker-compose run majora_fe npm run check_i18n` (CI job: `frontend-checks`) —
  required once new i18n keys are added, to verify key-parity across all language files

## Notes

- The header button is a plain link (`Nav.Link` + `href`), not a controller-driven action, so
  no changes to `Header.jsx`/`HeaderController.js` are needed — keep the diff scoped to
  `HeaderHelper.jsx`.
- Do not touch `RegisterHelper.jsx`/`StaffUserEditHelper.jsx` — this is a new, independent page
  that only borrows their shape/conventions.
- The password fields should always render blank (never prefilled from any stored value) —
  there is no read access to the current password, by design.
