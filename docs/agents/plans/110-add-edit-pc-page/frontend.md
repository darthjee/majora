# Frontend plan — issue #110 (add edit PC page)

See [plan.md](plan.md) for the full shared contract (request/response shapes) this file
consumes.

## 1. New route

`frontend/assets/js/utils/HashRouteResolver.js:22` — register the edit route next to the
existing PC route (anchored matching in `Route.js` means order between these two doesn't
affect correctness, but keep it adjacent for readability):

```javascript
this.#router.register('/games/:game_slug/pcs/:character_id/edit', 'pcCharacterEdit');
```

`frontend/assets/js/components/helpers/AppHelper.jsx:12` — add the new page to `PAGES`:

```javascript
pcCharacterEdit: <PcCharacterEdit />,
```

(import `PcCharacterEdit` from `../pages/PcCharacterEdit.jsx`).

## 2. Show page: Edit button + live auth reactivity

`frontend/assets/js/components/pages/PcCharacter.jsx` currently fetches the character once via
`PcCharacterController.buildEffect()` (`controllers/PcCharacterController.js:45`) using
`GenericClient.fetch()`, which does **not** send an `Authorization` header. Two changes:

**a) Send the token on the detail `GET`** so the server can compute `can_edit` correctly.
In `PcCharacterController.js:55`, replace the `this.client.fetch(...)` call with a direct
`this.client.request(...)` (inherited raw method from `BaseClient`, already used un-wrapped
elsewhere — see `AuthClient`) so a custom `Authorization` header can be attached:

```javascript
import AuthStorage from '../../../utils/AuthStorage.js';
// ...
const token = AuthStorage.getToken();
this.client.request(`/games/${params.game_slug}/pcs/${params.character_id}.json`, {
  headers: {
    Accept: 'application/json',
    ...(token ? { Authorization: `Token ${token}` } : {}),
  },
})
  .then((response) => {
    if (!response.ok) throw new Error('Unable to load character.');
    return response.json();
  })
  .then((character) => safeSet(this.setCharacter, character))
  .catch(() => safeSet(this.setError, 'Unable to load character.'))
  .finally(() => safeSet(this.setLoading, false));
```

**b) React to login/logout without a reload.** In `PcCharacter.jsx`, subscribe to
`AuthEvents` (same pattern as `Header.jsx`) and re-run the controller's fetch effect whenever
auth state changes, so `can_edit` (which depends on the token) gets re-evaluated:

```javascript
import AuthEvents from '../../utils/AuthEvents.js';
// ...
useEffect(() => controller.buildEffect()(), [controller]);

useEffect(() => {
  const handleAuthChanged = () => controller.buildEffect()();
  AuthEvents.subscribe(handleAuthChanged);
  return () => AuthEvents.unsubscribe(handleAuthChanged);
}, [controller]);
```

**c) Edit button.** `CharacterHelper.render` (`helpers/CharacterHelper.jsx:27`) gains an edit
link when `character.can_edit` is true:

```javascript
{character.can_edit && (
  <a className="btn btn-secondary mt-2" href={`#/games/${character.game_slug}/pcs/${character.id}/edit`}>
    {Translator.t('character_page.edit')}
  </a>
)}
```

Place it near `BackButton` (e.g. right below it, inside the existing `container`).

## 3. New edit page

Model directly after `Register.jsx` / `RegisterController.js` / `RegisterHelper.jsx`
(`frontend/assets/js/components/pages/{Register.jsx,controllers/RegisterController.js,helpers/RegisterHelper.jsx}`),
but the edit page also needs to **load** existing data first (like `PcCharacter.jsx` does),
then submit a `PATCH`.

**`frontend/assets/js/components/pages/PcCharacterEdit.jsx`** (new):
- On mount, fetch the character via the same authenticated `GET` as step 2a (reuse
  `PcCharacterController` or a thin subclass — do not duplicate the fetch logic).
- If the loaded character has `can_edit: false`, redirect immediately:
  `window.location.hash = '#/games/${gameSlug}/pcs/${characterId}'` (per plan.md's documented
  fallback for unauthorized direct navigation) instead of rendering the form.
- Otherwise render a controlled form (name, avatar_url, character_class, level, description)
  seeded from the loaded character.

**`frontend/assets/js/components/pages/controllers/PcCharacterEditController.js`** (new):
- `handleSubmit(characterId, gameSlug, fields)` sends
  `this.client.request(path, { method: 'PATCH', headers: {Authorization, Content-Type, Accept},
  body: JSON.stringify(fields) })` (raw `request`, not the throwing `.patch()` wrapper, since a
  `400` response must be inspected, not thrown away).
- On `response.ok` (`200`): navigate to `#/games/${gameSlug}/pcs/${characterId}`.
- On `400`: parse `{ errors }` from the body and set per-field error state.
- On `401`/`403`: set a general error state (this should only happen if permission changed
  mid-edit, e.g. token revoked in another tab) — show a generic error alert, no need for a
  dedicated message per status.

**`frontend/assets/js/components/pages/helpers/PcCharacterEditHelper.jsx`** (new): renders the
form using `FormField` for each input, plus a live avatar preview (reuse `CardAvatar`, fed by
the current `avatar_url` field state, so it updates as the user types — matching the issue's
"changing the URL changes the displayed image" requirement).

## 4. Per-field error display on `FormField`

`frontend/assets/js/components/elements/FormField.jsx` currently has no way to show a
field-level error. Extend it (backward compatible — new prop defaults to no error, so
`Register`/`Login`/recovery forms keep working untouched):

```javascript
export default function FormField({ id, type, label, value, onChange, errors = [] }) {
  return (
    <div className="mb-3">
      <label htmlFor={id} className="form-label">{label}</label>
      <input id={id} type={type} className="form-control" value={value} onChange={onChange} />
      {errors.map((message) => (
        <div key={message} className="alert alert-danger mt-1 mb-0 py-1">{message}</div>
      ))}
    </div>
  );
}
```

`PcCharacterEditHelper` passes `errors={fieldErrors.level ?? []}` etc. for each field.

## 5. Tests (`frontend/specs/`, mirrors `frontend/assets/js/`)

Follow the existing Jasmine convention (see `specs/.../pages/RegisterSpec.js` and the
`controllers/RegisterControllerSpec.js` pattern — spy on the client, assert calls/state).

- `PcCharacterSpec.js` — assert the edit button renders only when `character.can_edit` is
  `true`, and that the auth-changed subscription re-triggers the fetch effect.
- `PcCharacterControllerSpec.js` — assert the `Authorization` header is attached when a token
  exists in `AuthStorage`, and omitted when it doesn't.
- New `PcCharacterEditSpec.js` — redirect-on-`can_edit:false` behavior; form pre-filled from
  loaded character.
- New `PcCharacterEditControllerSpec.js` — success path navigates to the show page; `400`
  response populates field errors without navigating; `401`/`403` set a general error.
- `FormFieldSpec.js` (if it exists, else add) — renders nothing extra when `errors` is empty/
  omitted; renders one alert per message when provided.

Run locally: `docker-compose run --rm majora_fe yarn lint` and
`docker-compose run --rm majora_fe yarn test`.
