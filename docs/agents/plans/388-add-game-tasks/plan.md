# Plan: Add Game Tasks

Issue: [388-add-game-tasks.md](../issues/388-add-game-tasks.md)

## Overview

Introduce a `Task` entity scoped to a `Game` (optionally to one of its `GameSession`s) so a
GameMaster can keep a private DM checklist. Unlike every other resource in the app, Task's
list/detail/create/update endpoints are all gated to the game's GameMaster or a superuser —
there is no public read path. The frontend adds a new `/games/:game_slug/tasks` page with an
inline add form, checkbox toggling, and a view/edit modal for the long description.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)
- [translator](translator.md)

## Shared contracts

- New endpoints, all requiring the requesting user to be a GameMaster of the game (via
  `game_masters`) or a superuser — unauthenticated → 401 JSON body
  `{"errors": {"detail": ["authentication required"]}}`; authenticated non-editor → 403 JSON
  body `{"errors": {"detail": ["not allowed"]}}`. This applies to **every** method, including
  `GET`, unlike `GameSession`/`Treasure`/character endpoints.
  - `GET /games/<slug>/tasks.json` — paginated list (same pagination headers/params convention
    as `game_treasures`/`game_sessions`: `page`/`per_page` query params; `page`/`pages`/
    `per_page`/`total` response headers; plain JSON array body).
  - `POST /games/<slug>/tasks.json` — create; body `{ short_description, long_description?,
    completed?, session? }`, returns the created task (201) using the same item shape as the
    list.
  - `PATCH /games/<slug>/tasks/<id>.json` — partial update; body may include any of
    `short_description`, `long_description`, `completed`, `session` (nullable, to
    set/change/clear); returns the updated task (200). No `GET` on this route — the list
    endpoint already returns full task data (including `long_description`), so the frontend's
    per-task modal is populated from the already-fetched list, not a second fetch. `game` is
    never accepted from the request body.
  - No `DELETE` endpoint.
- Task item shape (used identically for list, create-response, and update-response):
  `{ id: number, short_description: string, long_description: string, completed: boolean,
  session: number|null }`. `session`, when set, must reference a `GameSession` belonging to
  the same game — otherwise the create/update request is rejected with 400.
- Frontend route `/games/:game_slug/tasks` (page key `gameTasks`), gated client-side the same
  way `/staff/users` gates on `is_staff/is_superuser` today: fetch the game's `access.json`
  (already used by `GameSessions`/`GameEdit`) and redirect to `#/games/:game_slug` when
  `can_edit` is falsy, before ever calling the tasks endpoints (which would otherwise 401/403).
- New i18n keys (see `translator.md` for the full list) under a `game_tasks_page` (and
  possibly `game_task_modal`) namespace in both `en.yaml` and `pt.yaml`; the frontend
  references them via `Translator.t('game_tasks_page.<key>')`, never hardcoded strings.

## Notes shared across agents

- Mirrors the existing `GameSession` "delegates edit rights to its game" pattern
  (`can_be_edited_by` → `self.game.can_be_edited_by(user)`), but is the first resource in the
  app where **read** access is also gated by that same check rather than being `AllowAny`.
- `data-access` review must be invoked once the backend part lands, since this adds a new
  model, three new endpoints, and non-trivial read-gating logic.
- `docs/agents/access-control.md` must be updated with a new `## Task` section in the same PR
  (backend's responsibility — see `backend.md`).
