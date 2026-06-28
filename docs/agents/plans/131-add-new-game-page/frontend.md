# Frontend Plan: Add New Game Page

Main plan: [plan.md](plan.md)

## Shared contracts

This agent consumes `POST /games.json` via a new `GameClient.createGame` method:
- POST to `/games.json` with `Authorization: Token <token>`, `Content-Type: application/json`, body `{ name, photo, description }`.
- On HTTP 201: parse body, read `game_slug`, redirect to `#/games/:game_slug`.
- On HTTP 400: parse `{ errors: { name?, photo?, description? } }`, display field errors inline.
- On HTTP 401: should not occur if auth guard is working (redirect to login before submitting).
- Other errors: display generic error.

Translation keys used by this agent (provided by the translator agent):
- `game_new_page.title`, `game_new_page.name_label`, `game_new_page.photo_label`,
  `game_new_page.upload_photo_button`, `game_new_page.description_label`,
  `game_new_page.submit`, `game_new_page.error`
- `games_page.new_game`

## Implementation Steps

### Step 1 — Add createGame to GameClient

In `frontend/assets/js/client/GameClient.js`, add:
```js
createGame(token, fields) {
  return this.request('/games.json', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Token ${token}` } : {}),
    },
    body: JSON.stringify(fields),
  });
}
```

### Step 2 — Register the /games/new route

In `frontend/assets/js/utils/HashRouteResolver.js`, register the literal route **before** the wildcard `/games/:game_slug` route:
```js
this.#router.register('/games/new', 'gameNew');
```
Insert this line immediately before `this.#router.register('/games/:game_slug/edit', 'gameEdit')`.

### Step 3 — Create GameNewController

Create `frontend/assets/js/components/pages/controllers/GameNewController.js`:
- Constructor accepts `setError`, `setFieldErrors` (and optional `gameClient`).
- `submitForm(event, formValues, setters)` method:
  1. Prevents default.
  2. Sets `status = 'submitting'`, clears field errors.
  3. Gets token from `AuthStorage.getToken()`.
  4. If no token, redirects to login (`window.location.hash = '/users/register'` or appropriate login trigger — mirror the unauthenticated guard in `GameEditController` which checks `game.can_edit`; here check token presence before submitting).
  5. Calls `this.gameClient.createGame(token, { name, photo, description })`.
  6. On 201: reads `game_slug` from response body, sets `window.location.hash = '/games/:game_slug'`.
  7. On 400: sets field errors from `data.errors`.
  8. Otherwise: sets `status = 'error'`.
- Extend `BasePageController`.

### Step 4 — Create GameNewHelper

Create `frontend/assets/js/components/pages/helpers/GameNewHelper.jsx`:
- Mirrors `GameEditHelper`.
- `static render(formState, handlers)`: renders a form with name, photo, description fields plus upload photo button and submit button.
- Uses `Translator.t('game_new_page.*')` keys.
- `static renderLoading()`: delegates to `GameHelper.renderLoading()`.
- Private `static #renderError(formState)`: renders `<ErrorAlert>` when `formState.status === 'error'`.

### Step 5 — Create GameNew page component

Create `frontend/assets/js/components/pages/GameNew.jsx`:
- Mirrors `GameEdit.jsx` structure.
- Manages state: `error`, `fieldErrors`, `status`, `name`, `photo`, `description`, `showUploadModal`.
- `useMemo` constructs a `GameNewController`.
- No `useEffect` for fetching (no existing data to load); on mount, check `AuthStorage.getToken()` — if absent, redirect to login immediately.
- `handleSubmit` calls `controller.submitForm(event, { name, photo, description }, { setStatus, setFieldErrors })`.
- Renders `GameNewHelper.render(...)` and a `<PhotoUploadModal>` (gameSlug can be `null` for new games — render the modal but the upload button may be a no-op or omitted until the game exists; check how `PhotoUploadModal` handles a null `gameSlug` and adjust accordingly).

### Step 6 — Register gameNew in AppHelper

In `frontend/assets/js/components/helpers/AppHelper.jsx`:
- Import `GameNew` from `'../pages/GameNew.jsx'`.
- Add `gameNew: <GameNew />` to the `PAGES` map.

### Step 7 — Add "New Game" link to GamesHelper

In `frontend/assets/js/components/pages/helpers/GamesHelper.jsx`:
- Add a "New Game" button/link (`<a href="#/games/new">`) inside the `render` method, styled consistently with other CTAs in the project (e.g. `btn btn-primary`).
- Use `Translator.t('games_page.new_game')` for the label.

### Step 8 — Add Jasmine specs

- `frontend/specs/assets/js/client/GameClientSpec.js` — add spec for `createGame`.
- `frontend/specs/assets/js/components/pages/controllers/GameNewControllerSpec.js` — new file covering `submitForm` success, 400, unauthenticated redirect, and generic error paths.
- `frontend/specs/assets/js/components/pages/helpers/GameNewHelperSpec.js` — new file covering `render` and `renderLoading`.
- `frontend/specs/assets/js/components/pages/helpers/GamesHelperSpec.js` — update to assert "New Game" link is present.
- `frontend/specs/assets/js/utils/HashRouteResolverSpec.js` (if exists) — add spec asserting `/games/new` resolves to `gameNew` before `/games/:game_slug`.

## Files to Change

- `frontend/assets/js/client/GameClient.js` — add `createGame` method
- `frontend/assets/js/utils/HashRouteResolver.js` — register `/games/new` route
- `frontend/assets/js/components/pages/controllers/GameNewController.js` — new file
- `frontend/assets/js/components/pages/helpers/GameNewHelper.jsx` — new file
- `frontend/assets/js/components/pages/GameNew.jsx` — new file
- `frontend/assets/js/components/helpers/AppHelper.jsx` — import and register `GameNew`
- `frontend/assets/js/components/pages/helpers/GamesHelper.jsx` — add "New Game" link
- `frontend/specs/assets/js/client/GameClientSpec.js` — add `createGame` spec
- `frontend/specs/assets/js/components/pages/controllers/GameNewControllerSpec.js` — new file
- `frontend/specs/assets/js/components/pages/helpers/GameNewHelperSpec.js` — new file
- `frontend/specs/assets/js/components/pages/helpers/GamesHelperSpec.js` — update

## CI Checks

- `frontend/`: `docker-compose run --rm majora_fe npm test` (CI job: `jasmine`)
- `frontend/`: `docker-compose run --rm majora_fe npm run lint` (CI job: `frontend-checks`)

## Notes

- `PhotoUploadModal` expects a `gameSlug` prop. For the GameNew page, the game does not yet exist, so the upload modal cannot be used before creation. Two options: (a) omit the upload photo button entirely from `GameNew` and rely on `GameEdit` for post-creation uploads; (b) only show the modal after a successful creation (redirect flow makes this impossible). Option (a) is simpler and consistent with the issue, which does not mention upload on the creation form. Keep the photo field as a URL text input only (no upload button).
- The route `/games/new` must be registered before `/games/:game_slug` in `HashRouteResolver` to prevent the wildcard from matching the literal `new` segment. This is explicitly called out in the issue.
- The `HashRouteResolver` spec file may not exist; check first before deciding to create or update it.
