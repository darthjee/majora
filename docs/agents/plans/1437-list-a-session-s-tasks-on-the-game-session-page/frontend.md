# Frontend Plan: List a session's tasks on the game session page

Main plan: [plan.md](plan.md)

## Shared contracts

- **Endpoint (existing, #1432):** `RequestStore.ensure({resource: 'task', quantityType: 'collection', params: {gameSlug}, query: {session: String(sessionId), per_page: '5'}})` resolves to `{data, pagination}`.
  - `data` is an array of `{id, short_description, long_description, completed, category, session: {id, title}|null}`, ordered by id.
  - `pagination` is `{page, pages, perPage, total}`.
  - The endpoint is DM/superuser-only (`@restricted`, `X-Skip-Cache`). Never call it unless `session.can_edit` is true.
- **Translation keys** (added by the translator agent, under `game_session_page`): `tasks_title`, `tasks_loading`, `tasks_empty`, `tasks_error`, `tasks_see_all` (interpolated with `{count}`). The existing `game_tasks_page.view` key is reused by the shared row.

## Steps

- [01 — Extract a shared task row](frontend/01-extract-task-row.md)
- [02 — Extract the task toggle/save mutations](frontend/02-extract-task-mutations.md)
- [03 — Add the SessionTasksWidget](frontend/03-add-session-tasks-widget.md)
- [04 — Render the widget on the session page](frontend/04-render-on-session-page.md)

## CI Checks
- `frontend/`: `docker-compose run --rm majora_fe npm run coverage` (CI job: `jasmine`)
- `frontend/`: `docker-compose run --rm majora_fe yarn lint` (CI job: `frontend-checks`)

## Notes
- No backend, Navi or proxy changes. Tasks must not be embedded in the (public, Navi-warmed) session serializer.
- `GameSessionController` first merges fail-closed permissions and then re-merges after `ensureGamePermissions`, so `session.can_edit` can flip from false to true after mount. The widget's effect must depend on its visibility and re-run when it becomes visible.
- Creating a task pre-assigned to the session is out of scope (#1439). Keep the extracted pieces reusable so #1439 can add a create form to the widget.
- Specs mirror source under `frontend/specs/assets/js/…` with the `Spec.js` suffix used by the neighboring files (e.g. `OpenPollsWidgetSpec.js`).
