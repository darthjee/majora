# Frontend Plan: Add Game Tasks

Main plan: [plan.md](plan.md)

## Shared contracts

- Consumes three backend routes, **all requiring the auth token** (unlike most other list/
  detail endpoints, which are public `GET`):
  - `GET /games/:slug/tasks.json` — paginated (`page`/`pages`/`per_page` response headers,
    same convention as `staff/users.json`/`game_treasures.json`).
  - `POST /games/:slug/tasks.json` — create; body `{ short_description, long_description?,
    completed?, session? }`; 201 + created task on success, 400 + `{errors: {...}}` on
    validation failure.
  - `PATCH /games/:slug/tasks/:id.json` — partial update, same body shape; 200 + updated task.
    No `GET` on this route.
- Task item shape: `{ id, short_description, long_description, completed, session }`
  (`session` nullable `GameSession` id — not needed by the UI beyond passing it through,
  since the issue doesn't ask for a session picker in the UI; omit a session field from the
  add/edit forms for this issue and just don't send `session` on create/update, unless you
  find a trivial place to add it — this is a judgment call, not a hard requirement).
- New route `/games/:game_slug/tasks` → page key `gameTasks`, following the exact registration
  order/convention already used for `gameSessions` in `HashRouteResolver.js`/`AppHelper.jsx`.
- Gating: since the tasks endpoints themselves 401/403 for non-editors, the page must check
  `game.can_edit` (via the existing `GameClient.fetchGameAccess`) **before** calling the tasks
  endpoints, and redirect (`window.location.hash = '/games/:game_slug'`) when `can_edit` is
  falsy — mirroring `GameSessionNewController#buildEffect`'s
  `fetchGameAccess` → `redirectIfNotAllowed` flow, not `GameSessionsController`'s (which fetches
  access only to toggle a button, since its list itself stays public).
- New i18n keys (see `translator.md`) under `game_tasks_page` (and a `game_task_edit_modal`
  or similar namespace for the modal) — reference via `Translator.t(...)`.

## Implementation Steps

### Step 1 — `GameTaskClient`

Add `frontend/assets/js/client/GameTaskClient.js` (mirrors `GameSessionClient.js`/
`StaffUserClient.js`), all methods requiring a token:

- `fetchTasks(gameSlug, token, params = new URLSearchParams())` → `getJson`
  `/games/${gameSlug}/tasks.json` (+ query string), mirroring
  `StaffUserClient#fetchUsers`'s param handling exactly (since, like staff users, this list
  needs the token and isn't reachable through the token-less `GenericClient`).
- `createTask(gameSlug, token, fields)` → `postJson` `/games/${gameSlug}/tasks.json`.
- `updateTask(gameSlug, id, token, fields)` → `patchJson`
  `/games/${gameSlug}/tasks/${id}.json`.

### Step 2 — Register the route

In `frontend/assets/js/utils/HashRouteResolver.js`, add (near the `sessions`/`photos`
entries, before the bare `/games/:game_slug` catch-all):

```js
this.#router.register('/games/:game_slug/tasks', 'gameTasks');
```

In `frontend/assets/js/components/helpers/AppHelper.jsx`, import `GameTasks` and add
`gameTasks: <GameTasks />` to the `PAGES` map, alongside the existing `gameSessions` entry.

### Step 3 — Controller

Add `frontend/assets/js/components/pages/controllers/GameTasksController.js`
(`extends BasePageController`), modeled on `StaffUsersController` (token-gated list +
redirect-on-forbidden) crossed with `GameSessionsController` (per-game scoping):

- `static getGameSlugFromTasksHash(hash)` via `BasePageController.extractParam`.
- Constructor takes `setTasks`, `setPagination`, `setLoading`, `setError`, optional
  `taskClient`/`gameClient` overrides (`GameTaskClient`/`GameClient`).
- `buildEffect()`: resolve `gameSlug`; call `gameClient.fetchGameAccess(gameSlug, token)`; if
  `!can_edit`, redirect to `#/games/${gameSlug}` (`window.location.hash = ...`) and stop; else
  fetch tasks via `taskClient.fetchTasks(gameSlug, token, paginationParams)`
  (`HashRouteResolver#getPaginationParams`), populate `setTasks`/`setPagination`, `setError` on
  failure — mirror `StaffUsersController#fetchUsers`'s response-handling shape (`response.ok`
  check, then `response.json()` + `response.headers`).
- `handleToggleCompleted(task)`: optimistically or post-confirmation update local `tasks`
  state, calling `taskClient.updateTask(gameSlug, task.id, token, { completed: !task.completed })`;
  roll back (or `setError`) on failure.
- `handleCreateTask(formValues, setters)`: calls `taskClient.createTask(...)`, prepends/
  appends the returned task to local state on 201, surfaces field errors on 400 (mirroring
  `GameSessionNewController#submitForm`'s 400 handling), sets a general error otherwise. Since
  this is an *inline* form (no navigation), keep this as an instance method returning a
  Promise rather than mutating `window.location.hash`.
- `handleSaveEdit(task, formValues, setters)`: calls `taskClient.updateTask(...)` with
  `{ short_description, long_description }`, updates the matching task in local state on
  success.

### Step 4 — Page + list helper

Add `frontend/assets/js/components/pages/GameTasks.jsx` and
`frontend/assets/js/components/pages/helpers/GameTasksHelper.jsx`, following the
`GameSessions.jsx`/`GameSessionsHelper.jsx` shape:

- Page renders `PageActions` (back to `#/games/:game_slug`, no separate "new" button — the
  add form is inline per the issue), a checklist (`<ul>`/`<li>` per task, each with a
  Bootstrap checkbox bound to `completed` calling `onToggle`, the `short_description` as the
  label, and a "view/edit" button that opens the modal from Step 5), the inline add form
  below the list, `Pagination`, loading/error states — same structural pieces as
  `GameSessionsHelper`.
- The inline add form is a small local component/section (short description input + long
  description textarea + submit button) — either inlined in `GameTasksHelper` or split into
  its own `GameTaskNewFormHelper`-style piece if it gets large; judgment call for whoever
  implements this, consistent with how other pages split rendering helpers.

### Step 5 — View/Edit modal

Add `frontend/assets/js/components/elements/TaskDetailModal.jsx` +
`frontend/assets/js/components/elements/helpers/TaskDetailModalHelper.jsx`, modeled on
`TreasureExchangeModal`'s component/controller-less-state-in-parent split and
`PhotoViewModalHelper`'s simplicity:

- Props: `show`, `task`, `onClose`, `onSave` (called with `{ shortDescription,
  longDescription }`).
- Local `editing` boolean state (owned by the `TaskDetailModal` component, not the helper):
  when `false`, render `long_description` as read-only text plus an "Edit" button; when
  `true`, render `short_description`/`long_description` as editable inputs plus Save/Cancel
  buttons. "Save" calls `onSave(...)` then flips `editing` back to `false`; "Cancel" discards
  local edits (reset from `task` props) and flips back without calling `onSave`.

### Step 6 — Specs

Add Jasmine specs mirroring the existing `GameSession*`/`StaffUsers*`/`TreasureExchangeModal`
spec structure under `frontend/specs/js/...` (client, controller, page, modal), covering:
- `GameTaskClient` request shape (path, method, headers, body) for all three methods.
- `GameTasksController`: redirect-on-forbidden, list fetch success/error, toggle-completed
  success/rollback, create success/field-errors/general-error, save-edit success.
- `GameTasks`/`GameTasksHelper` render smoke tests (loading/error/list/pagination/add-form).
- `TaskDetailModal`/`TaskDetailModalHelper`: view mode renders `long_description`; Edit
  switches to editable fields; Save calls `onSave` with the edited values and exits edit mode;
  Cancel discards edits without calling `onSave`.

## Files to Change

- `frontend/assets/js/client/GameTaskClient.js` — new
- `frontend/assets/js/utils/HashRouteResolver.js` — register `/games/:game_slug/tasks`
- `frontend/assets/js/components/helpers/AppHelper.jsx` — wire `gameTasks` page
- `frontend/assets/js/components/pages/controllers/GameTasksController.js` — new
- `frontend/assets/js/components/pages/GameTasks.jsx` — new
- `frontend/assets/js/components/pages/helpers/GameTasksHelper.jsx` — new
- `frontend/assets/js/components/elements/TaskDetailModal.jsx` — new
- `frontend/assets/js/components/elements/helpers/TaskDetailModalHelper.jsx` — new
- `frontend/specs/js/client/GameTaskClient_spec.js` — new
- `frontend/specs/js/components/pages/controllers/GameTasksController_spec.js` — new
- `frontend/specs/js/components/pages/GameTasks_spec.jsx` — new
- `frontend/specs/js/components/elements/TaskDetailModal_spec.jsx` — new

## CI Checks

- `frontend/`: `docker-compose run --rm majora_fe yarn test` (CI job: `jasmine`)
- `frontend/`: `docker-compose run --rm majora_fe yarn lint` (CI job: `frontend-checks`)
- `frontend/`: `docker-compose run --rm majora_fe yarn check_i18n` (CI job: `frontend-checks`)

## Notes

- Exact file names for the page-local add-form and modal are suggestions consistent with
  existing naming conventions — the implementing agent should feel free to adjust granularity
  (e.g. splitting the add form into its own helper) if the page grows unwieldy.
- Do not add a session picker to the add/edit forms in this issue — the model/API support
  `session` for future use, but the issue's UI requirements only cover short/long description
  and completion toggling.
