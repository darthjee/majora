# Frontend Plan: Tasks page unreachable from nav

Main plan: [plan.md](plan.md)

## Implementation Steps

### Step 1 — Add the `isDmOrAdmin` derived context field

In `frontend/assets/js/utils/context/CurrentPageContext.js`, add a new derived flag alongside `hasGameAccess`, computed the same way but deliberately excluding `is_player`:

```js
static build(state) {
  return {
    ...state,
    isGamePage: Boolean(state.route?.gameSlug),
    isPcPage: Boolean(state.route?.page?.startsWith('pcCharacter')),
    isNpcPage: Boolean(state.route?.page?.startsWith('npcCharacter')),
    hasGameAccess: CurrentPageContext.#hasGameAccess(state.gameAccess),
    isDmOrAdmin: CurrentPageContext.#isDmOrAdmin(state.gameAccess),
  };
}

/**
 * Derives whether `gameAccess` grants a DM or admin (staff/superuser) role —
 * unlike {@link #hasGameAccess}, deliberately excludes `is_player`.
 *
 * @param {{is_dm: boolean, is_player: boolean, is_superuser: boolean, is_staff: boolean}|undefined} gameAccess - Game-level access flags, or `undefined` when unresolved.
 * @returns {boolean} `true` when the DM, superuser, or staff flag is set.
 */
static #isDmOrAdmin(gameAccess) {
  return Boolean(gameAccess?.is_dm || gameAccess?.is_superuser || gameAccess?.is_staff);
}
```

Update the class doc comment's `@returns` line (currently lists `isGamePage`, `isPcPage`, `isNpcPage`, and `hasGameAccess`) to also mention `isDmOrAdmin`.

### Step 2 — Add the `IS_DM_OR_ADMIN` rule and the `tasks` nav entry

In `frontend/assets/js/components/common/header/helpers/HeaderNavHelper.jsx`:

1. Add a new rule constant next to `HAS_GAME_ACCESS`:
   ```js
   const IS_DM_OR_ADMIN = { all: ['isGamePage', 'isDmOrAdmin'] };
   ```
2. Add a `gameItem(...)` entry to `NAV_LINK_REGISTRY`, right after `sessions` and before `photos`:
   ```js
   gameItem('tasks', '/tasks', 'game_page.tasks', IS_DM_OR_ADMIN),
   ```
3. Update the `gameItem` JSDoc comment (currently says "the Players/Polls/Sessions items pass the stricter `HAS_GAME_ACCESS` rule instead, restricting them to the game's DM(s), players, and admins") to also mention that `tasks` uses the even stricter `IS_DM_OR_ADMIN` rule (DM/staff/superuser only, no players), matching `EndpointPermission`'s `'game_task', 'restricted', 'edit'` backend gate.

### Step 3 — Add translations

Add the `tasks` key to the `game_page:` namespace in both locale files, next to `sessions`/`players`:

- `frontend/assets/i18n/en/game_page.yaml`: `tasks: Tasks`
- `frontend/assets/i18n/pt/game_page.yaml`: `tasks: Tarefas`

### Step 4 — Update specs

- `frontend/specs/assets/js/utils/context/CurrentPageContextSpec.js`: add a new `describe('isDmOrAdmin', ...)` block mirroring the existing `hasGameAccess` block, but:
  - parameterize only `['is_dm', 'is_superuser', 'is_staff']` for the "is true when gameAccess.\<field\> is true" cases (not `is_player`);
  - add an explicit case asserting `isDmOrAdmin` is `false` when only `gameAccess.is_player` is `true` — the one case that must diverge from `hasGameAccess`;
  - keep the "false when every role flag is false" and "false when gameAccess is absent" cases, same shape as `hasGameAccess`'s.
- `frontend/specs/assets/js/components/common/header/helpers/HeaderHelper/gameNavLinksSpec.js`:
  - Add a new test (or extend the existing "does not render the Players/Polls/Sessions items when gameAccess grants no role"/"...is absent" tests) asserting `href="#/games/epic-quest/tasks"` is also absent in those same two cases.
  - Add a role-parameterized test analogous to the existing Players/Polls/Sessions one, but only for `['is_dm', 'is_superuser', 'is_staff']`, asserting the Tasks link **is** rendered for each.
  - Add a dedicated test asserting the Tasks link is **not** rendered when `gameAccess` is `{ is_dm: false, is_player: true, is_superuser: false, is_staff: false }` (player-only) — the key behavioral difference from Players/Polls/Sessions.
  - Update the existing "renders items in Show/PCs/.../Photos order" test's `hrefs` array to insert `'#/games/epic-quest/tasks"'` between `'#/games/epic-quest/sessions"'` and `'#/games/epic-quest/photos"'` (the test already renders with `gameAccess: { is_dm: true, ... }`, so Tasks will render alongside Sessions).

## Files to Change

- `frontend/assets/js/utils/context/CurrentPageContext.js` — add the `isDmOrAdmin` derived field.
- `frontend/assets/js/components/common/header/helpers/HeaderNavHelper.jsx` — add `IS_DM_OR_ADMIN` and the `tasks` `gameItem(...)` entry.
- `frontend/assets/i18n/en/game_page.yaml` — add `tasks: Tasks`.
- `frontend/assets/i18n/pt/game_page.yaml` — add `tasks: Tarefas`.
- `frontend/specs/assets/js/utils/context/CurrentPageContextSpec.js` — add `isDmOrAdmin` coverage.
- `frontend/specs/assets/js/components/common/header/helpers/HeaderHelper/gameNavLinksSpec.js` — add/update Tasks-item coverage.

No changes needed to `frontend/specs/assets/js/components/common/header/helpers/HeaderHelper/registrySpec.js`: it already generically asserts every `NAV_LINK_REGISTRY`/`AUTH_CONTROL_REGISTRY` rule only references real `CurrentPageContext` fields, which will now include `isDmOrAdmin` once Step 1 lands — no changes needed there, just confirm it still passes.

## CI Checks

- `frontend`: `docker-compose run --rm majora_fe yarn lint` (CI job: `frontend-checks`)
- `frontend`: `docker-compose run --rm majora_fe npm run check_i18n` (CI job: `frontend-checks`)
- `frontend`: `docker-compose run --rm majora_fe yarn coverage` (CI job: `jasmine`)

## Notes

- No backend or routing changes needed: the route (`/games/:game_slug/tasks`), page mapping (`gameTasks`), and access config (`accessRouteConfig.js`/`AccessRouteConfigStore.js`) already exist and are untouched by this issue.
- No page-level guard is added to `GameTasks.jsx`/`GameTasksController` (decided in the issue): a player who reaches the URL directly still hits the backend's existing `403` via `EndpointPermission`, surfaced through the controller's existing error-state handling.
- Issue #1314 (missing single-task GET/DELETE endpoint) is out of scope here — independent, backend-only follow-up.
