# Task

Tasks are a DM-private checklist scoped to a game (and optionally one of its `GameSession`s),
mirroring `GameSession`'s "delegates edit rights to its game" ownership pattern
(**TaskEdit**). Unlike every other resource in this document, **Task has no public read path**:
List and Detail are gated by `TaskEditPermission` exactly like Create and Update, since a task
may hold DM-only prep notes. There is no `GameSession`/`Treasure`-style `AllowAny` GET anywhere
on this resource — `TaskEditPermission.check()` is invoked unconditionally at the top of both
`game_tasks_list` (for `GET` and `POST` alike) and `game_task_detail` (for its sole `PATCH`
method), the first resource in this codebase where read access requires the same authorization
as write access.

| Action | Who can |
|--------|---------|
| List (`GET /games/<slug>/tasks.json`) | **TaskEdit**; paginated, ordered by `id` (creation order); 404 if game slug unknown |
| Create (`POST /games/<slug>/tasks.json`) | Same as List |
| Update (`PATCH /games/<slug>/tasks/<id>.json`) | Same as List; 404 if task id unknown or the task does not belong to that game |
| Delete | Superuser only (via Django admin, out of scope) — no `DELETE` endpoint exists |

There is no standalone detail-GET endpoint (`GET /games/<slug>/tasks/<id>.json` does not exist):
since every viewer of a task is already an editor (List already returns the full item shape,
including `long_description`), a separate detail read path would carry no additional
information. `PATCH` is the only method registered on the `<id>.json` route.

**Exposed fields** (list, create-response, and update-response — all three share
`GameTaskListSerializer`): `id`, `short_description`, `long_description`, `completed`,
`session` (nullable `GameSession` id).

**Write fields** (create/update): `short_description` (required for create, optional for
update), `long_description` (optional, may contain line breaks), `completed` (optional,
defaults to `False`), `session` (optional, nullable — settable, changeable, or clearable via
`null`). `game` is never accepted from the request payload — always assigned server-side from
the `game_slug` URL segment.

**`session` validation**: when provided (non-null) on create or update, `session` must be a
`GameSession` belonging to the same game as the task, or the request is rejected with 400
(`{"errors": {"session": [...]}}`) — enforced in `validate_session` on both
`GameTaskCreateSerializer` and `GameTaskUpdateSerializer`, which read the resolved `Game`
instance from serializer `context={'game': game}`.

**`session`'s own `on_delete` behavior:** the `session` FK uses `on_delete=models.SET_NULL` (not
`CASCADE`), so deleting a `GameSession` via Django admin detaches its tasks (sets
`task.session` to `null`) rather than deleting them — a task is expected to outlive the session
it was originally scoped to.
