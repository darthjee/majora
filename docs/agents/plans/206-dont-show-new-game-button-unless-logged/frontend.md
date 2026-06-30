# Frontend Plan: Don't Show New Game Button Unless Logged

Main plan: [plan.md](plan.md)

## Shared contracts

No cross-agent contract. The auth state is tracked entirely client-side via `AuthStorage.getToken()` (initial value) and `AuthEvents` (live updates).

## Implementation Steps

### Step 1 — Update `GamesHelper.render()` to accept `loggedIn`

In `frontend/assets/js/components/pages/helpers/GamesHelper.jsx`:
- Add a `loggedIn` parameter (boolean) to `render(games, pagination, loggedIn)`.
- Wrap the `<NewButton>` render in a `{loggedIn && (...)}` conditional.
- Update JSDoc to document the new parameter.

### Step 2 — Subscribe to `AuthEvents` in `Games.jsx`

In `frontend/assets/js/components/pages/Games.jsx`:
- Add a `loggedIn` state variable, initialized from `AuthStorage.getToken() !== null`.
- Add a `useEffect` that subscribes to `AuthEvents` and updates `loggedIn` on `auth:changed` events (same pattern used in `PcCharacter.jsx`).
- Pass `loggedIn` as the third argument to `GamesHelper.render(games, pagination, loggedIn)`.
- Import `AuthEvents` and `AuthStorage`.

### Step 3 — Update `GamesHelperSpec.js`

In `frontend/specs/assets/js/components/pages/helpers/GamesHelperSpec.js`:
- Update the existing `'renders a New Game link'` test to pass `loggedIn: true` (i.e. call `GamesHelper.render(games, pagination, true)`).
- Add a test `'does not render a New Game link when not logged in'` that passes `loggedIn: false` and asserts `href="#/games/new"` is absent.
- Update any other tests in `.render` that call `GamesHelper.render(games, pagination)` without a third argument — pass `true` to maintain existing behavior (all other tests assert things unrelated to the button; they should still pass with a logged-in user).

## Files to Change

- `frontend/assets/js/components/pages/helpers/GamesHelper.jsx` — add `loggedIn` param, conditional render
- `frontend/assets/js/components/pages/Games.jsx` — subscribe to AuthEvents, pass `loggedIn`
- `frontend/specs/assets/js/components/pages/helpers/GamesHelperSpec.js` — update and add tests

## CI Checks

- `frontend`: `docker-compose run --rm majora_fe npm test` (CI job: `jasmine`)
- `frontend`: `docker-compose run --rm majora_fe npm run lint` (CI job: `checks`)

## Notes

- The `AuthStorage.getToken()` call in `useState` initializer gives the correct starting value when the page mounts after the user has already logged in (token is already in memory). The `AuthEvents` subscription keeps it current if the user logs in or out while on the page.
- Do not call `AuthStorage` from within `GamesHelper` — the helper is a pure rendering class; the component owns the state.
