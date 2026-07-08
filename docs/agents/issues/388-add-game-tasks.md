# Add Game Tasks

## Context

DMs need a lightweight way to track prep or in-session to-dos for a game without leaving Majora. There is currently no checklist-style entity scoped to a `Game` (and optionally a `GameSession`). This introduces a new `Task` entity that follows the same "delegates edit rights to its game" ownership pattern already used by `GameSession`, but — unlike `GameSession`/`Treasure`/NPC — is private to the GameMaster rather than publicly readable, since tasks may hold DM-only prep notes.

## What needs to be done

Backend:
- New `Task` model: `game` (FK, required), `session` (FK to `GameSession`, nullable), `short_description` (string), `long_description` (text, may contain line breaks), `completed` (boolean, default `False`). `can_be_edited_by(user)` delegates to `self.game.can_be_edited_by(user)`, mirroring `GameSession`.
- `TaskEditPermission` (mirroring `GameSessionEditPermission`/`GameEditPermission`) — GameMaster of that game, or superuser. Unlike `GameSession`/`Treasure`/NPC, this permission also gates **read** access (list and detail), not just writes.
- `GET /games/<slug>/tasks.json` — list tasks for the game; GameMaster of that game or superuser only. Unauthenticated returns 401, authenticated non-GameMaster returns 403.
- `POST /games/<slug>/tasks.json` — create a task (`short_description`, `long_description`, `completed`, optional `session`); same permission as list. `session`, when given, must belong to the same game.
- `PATCH /games/<slug>/tasks/<id>.json` — `short_description`, `long_description`, `completed`, and `session` are all writable (session may be set, changed, or cleared); `game` is never accepted from the request payload. Same permission as list/create.
- No `DELETE` endpoint in this issue, matching the `GameSession`/`Treasure` convention (removal only via Django admin, superuser-only).
- Update `docs/agents/access-control.md` with the new Task section in the same PR.

Frontend:
- New route `/games/:game_slug/tasks` (plural `games`, matching the existing route convention — e.g. `/games/:game_slug/treasures`, `/games/:game_slug/sessions`), gated to the GameMaster of that game or superuser (redirect/404 for anyone else, consistent with the API), listing tasks as checkboxes labeled with `short_description`.
- An inline add form on this same page (short description + long description fields) submits `POST /games/<slug>/tasks.json` to create a new task, without navigating to a separate page.
- Toggling a checkbox sends `PATCH /games/<slug>/tasks/<id>.json` with the new `completed` value.
- A button per task opens a modal showing the full `long_description`. The modal has an Edit button that, when clicked, hides itself and shows Save/Cancel, turning the short/long description into editable fields. Save sends `PATCH /games/<slug>/tasks/<id>.json` with the updated `short_description`/`long_description`; Cancel discards the changes.
- Add i18n keys for the new labels/buttons to `frontend/assets/i18n/en.yaml` and `pt.yaml`.

Access control:
- List, detail, create, and update are all restricted to the GameMaster of that game, or superuser — unlike `GameSession`/`Treasure`/NPC endpoints (which are publicly readable and only gate writes), Tasks are not readable by anyone else, including players, since they may hold DM-only prep notes.

## Acceptance criteria

- [ ] `Task` model exists with `game` (required FK), `session` (nullable FK to `GameSession` of the same game), `short_description`, `long_description`, `completed` (default `False`), and `can_be_edited_by(user)` delegating to `self.game.can_be_edited_by(user)`.
- [ ] `GET /games/<slug>/tasks.json` lists tasks for the game, restricted to the game's GameMaster or superuser (401 unauthenticated, 403 otherwise).
- [ ] `POST /games/<slug>/tasks.json` creates a task with the same permission, validating that `session` (if given) belongs to the same game.
- [ ] `PATCH /games/<slug>/tasks/<id>.json` updates `short_description`, `long_description`, `completed`, and `session` (settable/changeable/clearable), ignoring any `game` field in the payload, with the same permission.
- [ ] No `DELETE` endpoint is added.
- [ ] `docs/agents/access-control.md` documents the new Task access rules.
- [ ] Frontend route `/games/:game_slug/tasks` lists tasks as checkboxes, gated to the GameMaster or superuser.
- [ ] Frontend inline add form creates a task via `POST` without leaving the page.
- [ ] Toggling a checkbox updates `completed` via `PATCH`.
- [ ] A per-task modal shows the full `long_description` and supports Edit (turns fields editable) / Save (`PATCH`) / Cancel (discard) flows.
- [ ] New i18n keys are added to both `frontend/assets/i18n/en.yaml` and `pt.yaml`.

---

Tags: :shipit:
