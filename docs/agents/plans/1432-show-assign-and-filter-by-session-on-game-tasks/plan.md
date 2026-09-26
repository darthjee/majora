# Plan: Show, assign and filter by session on game tasks

Issue: [1432-show-assign-and-filter-by-session-on-game-tasks.md](../../issues/1432-show-assign-and-filter-by-session-on-game-tasks.md)

## Overview
Expose a task's session as a nested `{id, title}` object, add a `session` filter (`<id>` / `none`) to the game tasks list endpoint, and add a public, searchable `GET /games/:game_slug/sessions.json` for the session picker. On the frontend, show the session in the task list and detail modal, add a clearable session picker (first 5 matches) to the create and edit forms, and add a Session filter (Any / No session / specific session) to `TaskFilters`, kept in the URL hash. Listing a session's tasks on the session page is out of scope (#1437).

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)
- [translator](translator.md)
- [cache](cache.md)

## Shared contracts

### 1. Task payload (`GET /games/:game_slug/tasks.json`, and the `POST /games/:game_slug/tasks.json` / `PATCH /games/:game_slug/tasks/:id.json` responses)

`session` becomes a nested object (or `null`):

```json
{ "id": 7, "short_description": "Print minis", "long_description": "", "completed": false,
  "category": "printing", "session": { "id": 3, "title": "Session 3 — The Crypt" } }
```

Requests are unchanged: `POST`/`PATCH` still accept `session` as an integer id or `null` (validated to belong to the same game, error code `session_wrong_game`).

### 2. Task list `session` filter (`GET /games/:game_slug/tasks.json?session=…`)

- `session=<integer id>` → only tasks linked to that session.
- `session=none` → only tasks with no session (`session__isnull=True`).
- Absent or any other value → no session filtering ("Any").
- Combines (AND) with the existing `category` and `completed` filters, and with `page`/`per_page`.

### 3. Session search (`GET /games/:game_slug/sessions.json?name=<term>&per_page=5`) — new `GET` on the existing (POST-only) route

- Same access as the other session lists (`AllowAny`, public, like `past`/`future`/`unscheduled`).
- `name`: case-insensitive substring match on `GameSession.title` (via `common.query_filters.filter_by_name(..., field="title")`); absent/blank → all of the game's sessions.
- Ordered by `-date` with dateless sessions last, then `-id` (most recent first), paginated via `paginated_list_response` (standard `page`/`per_page` headers).
- Item shape (`{id, name}` is what `ResourcePickerSearch` renders):

```json
[{ "id": 3, "name": "Session 3 — The Crypt", "title": "Session 3 — The Crypt", "date": "2026-09-30" }]
```

### 4. Frontend request config

- `sessionConfig.js` gains `GET.collection` → `/games/${gameSlug}/sessions.json` (`permission: null`, `regular`/`private` the same object).
- `ResourcePickerSearch` / `SingleResourcePickerField` accept an optional `picker.params` (e.g. `{ gameSlug }`) forwarded to `RequestStore.ensure`.

### 5. Translation keys (en + pt)

- `game_tasks_page.new_session_label`, `game_tasks_page.new_session_search_placeholder`
- `game_task_edit_modal.session_label`, `game_task_edit_modal.session_search_placeholder`, `game_task_edit_modal.no_session`
- `game_tasks_page.filter_session_label`, `game_tasks_page.filter_session_any` (not needed if `FilterSelect` renders its own blank option), `game_tasks_page.filter_session_none`, `game_tasks_page.filter_session_specific`, `game_tasks_page.filter_session_search_placeholder`
- `resource_picker.clear` (label/aria-label for the picker's new clear button)

## Reviews
- `data-access` and `security` should review the new `GET /games/:game_slug/sessions.json` and the `session` serializer change (new endpoint, serializer field shape change). The `access-control/game-session.md` and `task.md` docs must be updated.
