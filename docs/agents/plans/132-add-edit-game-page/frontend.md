# Frontend Plan: Add Edit Game Page

Main plan: [plan.md](plan.md)

## Shared contracts

This agent consumes:
- `PATCH /games/<game_slug>.json` — returns 200 with updated game object, or 401/403/400.
- `GET /games/<game_slug>/access.json` — always 200 `{can_edit: bool}`, never 401/404.
- Translation namespace `game_edit_page` with keys: `title`, `name_label`, `photo_label`, `description_label`, `submit`, `error`.

## Implementation Steps

### Step 1 — Add `GameClient`

Create `frontend/assets/js/client/GameClient.js`:
- Extends `BaseClient`.
- `fetchGame(gameSlug, token)` — `GET /games/${gameSlug}.json` with optional auth header.
- `fetchGameAccess(gameSlug, token)` — `GET /games/${gameSlug}/access.json` with optional auth header.
- `updateGame(gameSlug, token, fields)` — `PATCH /games/${gameSlug}.json` with JSON body `{name?, photo?, description?}` and auth header.
- Add Jasmine specs in `frontend/specs/client/GameClientSpec.js`.

### Step 2 — Add `gameEdit` route in `HashRouteResolver`

In `frontend/assets/js/utils/HashRouteResolver.js`:
- Register `'/games/:game_slug/edit'` → `'gameEdit'` **before** the existing `/games/:game_slug` entry (so it takes precedence).
- Update `HashRouteResolverSpec.js` to verify the new route resolves to `'gameEdit'` and that `/games/:game_slug` still resolves to `'game'`.

### Step 3 — Update `GameController` to fetch access info

In `frontend/assets/js/components/pages/controllers/GameController.js`:
- Constructor: accept a `GameClient` instance (or `null` to default to `new GameClient()`). Add `this.gameClient`.
- In `buildEffect()`: after fetching the game object, also fetch `/games/${gameSlug}/access.json` (using `this.gameClient.fetchGameAccess(gameSlug, AuthStorage.getToken())`). On success, merge `{can_edit: bool}` onto the game object before calling `safeSet(this.setGame, ...)`. On failure, set `can_edit: false` (silently).
- Import `AuthStorage` and `GameClient`.
- Update `GameControllerSpec.js` accordingly.

### Step 4 — Update `GameHelper` to show edit link

In `frontend/assets/js/components/pages/helpers/GameHelper.jsx`:
- In `render(game, pcs, npcs)`: when `game.can_edit` is `true`, render an edit link `<a href={\`#/games/${game.game_slug}/edit\`}>` using the `page_link` element or a plain anchor, visually styled as a button or link, positioned near the game title.
- Update `GameHelperSpec.js` (or create it) to test that the edit link is rendered when `can_edit: true` and absent when `can_edit: false`.

### Step 5 — Add `GameEditController`

Create `frontend/assets/js/components/pages/controllers/GameEditController.js`:
- Constructor: `setGame`, `setLoading`, `setError`, `setFieldErrors`, `gameClient = null`.
- `buildEffect()`: extract `game_slug` from hash using a `getGameSlugFromEditHash` helper (extracts `:game_slug` from `/games/:game_slug/edit`). Fetch game access and game detail in parallel. If `can_edit` is false, redirect to `#/games/${gameSlug}`. Otherwise, seed game fields.
- `submitForm(event, gameSlug, formValues, setters)`: PATCH the game, on 200 redirect to `#/games/${gameSlug}`, on 400 set field errors, on other error set general error.
- Add Jasmine specs in `frontend/specs/components/pages/controllers/GameEditControllerSpec.js`.

### Step 6 — Add `GameEditHelper`

Create `frontend/assets/js/components/pages/helpers/GameEditHelper.jsx`:
- Class (not an instance — mirrors `GameHelper`) with static methods `render(game, handlers)` and `renderLoading()`.
- `renderLoading()`: delegates to `GameHelper.renderLoading()`.
- `render(formState, handlers)`: renders a form with inputs for `name`, `photo` (URL), and `description`. Uses `Translator.t('game_edit_page.<key>')` for all labels. Shows field errors if any. Submit button calls `handlers.onSubmit`. When `formState.status === 'submitting'`, disables the submit button.
- Add Jasmine specs in `frontend/specs/components/pages/helpers/GameEditHelperSpec.js`.

### Step 7 — Add `GameEdit` page component

Create `frontend/assets/js/components/pages/GameEdit.jsx`:
- Follows the same pattern as `Game.jsx`: instantiate controller via `useMemo`, call `buildEffect` in `useEffect`, render via helper.
- State: `game`, `loading`, `error`, `fieldErrors`, `status`, `name`, `photo`, `description`.
- Redirect logic: if the controller signals `can_edit: false` after load, redirect to the game detail page.
- Add Jasmine spec in `frontend/specs/components/pages/GameEditSpec.jsx`.

### Step 8 — Wire `GameEdit` into `App`

In `frontend/assets/js/components/App.jsx` (or wherever the page switch is done):
- Import `GameEdit`.
- Add a case for `'gameEdit'` that renders `<GameEdit />`.
- Update `AppSpec.jsx` if it enumerates routes.

## Files to Change

- `frontend/assets/js/client/GameClient.js` — new file
- `frontend/assets/js/utils/HashRouteResolver.js` — add `gameEdit` route
- `frontend/assets/js/components/pages/controllers/GameController.js` — fetch access, merge `can_edit`
- `frontend/assets/js/components/pages/helpers/GameHelper.jsx` — add edit link
- `frontend/assets/js/components/pages/controllers/GameEditController.js` — new file
- `frontend/assets/js/components/pages/helpers/GameEditHelper.jsx` — new file
- `frontend/assets/js/components/pages/GameEdit.jsx` — new file
- `frontend/assets/js/components/App.jsx` — wire `gameEdit` page
- `frontend/specs/client/GameClientSpec.js` — new file
- `frontend/specs/components/pages/controllers/GameEditControllerSpec.js` — new file
- `frontend/specs/components/pages/helpers/GameEditHelperSpec.js` — new file
- `frontend/specs/components/pages/GameEditSpec.jsx` — new spec
- (Update existing specs as needed)

## CI Checks

- `frontend/`: `docker-compose run frontend npm run coverage` (CI job: `frontend-test`)
- `frontend/`: `docker-compose run frontend npm run check_i18n` (CI job: `frontend-i18n`)

## Notes

- `GameClient` is a new client (no existing one for games). The existing `GenericClient` handles the game detail GET in `GameController`; this change introduces `GameClient` only for the access and PATCH calls. Alternatively, the PATCH and access calls could be added to `GenericClient`, but a dedicated `GameClient` mirrors the `CharacterClient` pattern.
- The `can_edit` merge in `GameController` must be transparent to the existing `GameHelper.render` — passing it as a field on the game object is fine since the helper only reads known fields.
- `GameEditHelper` uses static methods (like `GameHelper`) rather than the instance pattern (like `PcCharacterEditHelper`) because the game edit form has no NPC/PC variant.
- All redirects when `can_edit` is false must use `window.location.hash` assignment (same pattern as `BaseCharacterEditController`).
