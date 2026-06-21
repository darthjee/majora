# Frontend Plan: Add favorite language to user

Main plan: [plan.md](plan.md)

## Shared contracts

- `status.json` response, when logged in, may include `settings: {favorite_language}`.
- `POST /users/language.json` `{language}` with `Authorization: Token <token>` and `X-Skip-Cache: 1` -> `200 {"favorite_language": "<code>"}`.
- Only called when the language selector changes while the user is logged in.

## Implementation Steps

### Step 1 — Extend `AuthClient`
Add to `frontend/assets/js/client/AuthClient.js`:
```js
setLanguagePreference(token, language) {
  return fetch('/users/language.json', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Skip-Cache': '1',
      Authorization: `Token ${token}`,
    },
    body: JSON.stringify({ language }),
  });
}
```

### Step 2 — Apply the saved preference on page load
In `frontend/assets/js/components/elements/controllers/HeaderController.js`'s `checkStatus()`, after a successful logged-in response, read `data.settings?.favorite_language` and, when present and different from the current `Translator.getLanguage()`, call `Translator.setLanguage(data.settings.favorite_language)` (import `Translator` from `../../../i18n/Translator.js`).

### Step 3 — Persist on change while logged in
`LanguageSelectorController.handleLanguageChange` (issue #79) already calls `Translator.setLanguage(language)` unconditionally — that behavior stays for logged-out users. Add a way for `Header` to also persist the change when logged in:
- `LanguageSelector.jsx` accepts an optional `onLanguageChange` prop; `LanguageSelectorController.handleLanguageChange` calls it (if provided) after updating the translator/local state.
- `HeaderHelper.render`/`#renderAuthControl`-equivalent area: pass `handlers.onLanguageChange` down to `<LanguageSelector onLanguageChange={handlers.onLanguageChange} />`.
- `HeaderController` gains `handleLanguageChange(language)`: if `this.loggedIn` (track this via a new private field updated whenever `setLoggedIn` is called — or simplest, accept the current `loggedIn` value as a parameter from `Header.jsx`, which already holds that state) call `this.client.setLanguagePreference(AuthStorage.getToken(), language)`, otherwise no-op.
- `Header.jsx` wires `onLanguageChange: (language) => controller.handleLanguageChange(language, loggedIn)`.

### Step 4 — Tests
Update `HeaderControllerSpec.js` (status check applies `settings.favorite_language`; `handleLanguageChange` calls `setLanguagePreference` only when logged in), `HeaderSpec.js`/`HeaderHelperSpec.js` (prop threading), `LanguageSelectorSpec.js`/`LanguageSelectorControllerSpec.js` (`onLanguageChange` callback invoked), and `AuthClientSpec.js` (new `setLanguagePreference` request shape).

## Files to Change
- `frontend/assets/js/client/AuthClient.js` — add `setLanguagePreference`.
- `frontend/assets/js/components/elements/controllers/HeaderController.js` — apply saved language on status check, add `handleLanguageChange`.
- `frontend/assets/js/components/elements/Header.jsx` — wire `onLanguageChange`.
- `frontend/assets/js/components/elements/helpers/HeaderHelper.jsx` — pass `onLanguageChange` to `LanguageSelector`.
- `frontend/assets/js/components/elements/LanguageSelector.jsx` — accept `onLanguageChange` prop.
- `frontend/assets/js/components/elements/controllers/LanguageSelectorController.js` — invoke the new callback.
- `frontend/specs/...` — updated specs per Step 4.

## CI Checks
- `frontend`: `npm run lint` (CI job: `frontend-checks`)
- `frontend`: `npm run coverage` (CI job: `jasmine`)
