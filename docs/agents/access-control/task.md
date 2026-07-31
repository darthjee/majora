# Task

**[Game resource](principles.md#resource-categories).** Tasks are a DM-private checklist scoped to
a game (and optionally one of its `GameSession`s), mirroring `GameSession`'s "delegates edit
rights to its game" pattern (**TaskEdit**, which delegates to **GameEdit**). Deviates from every
other resource in this document: **Task has no public read path** — List and Detail are gated by
the same **TaskEdit** as Create/Update, since a task may hold DM-only prep notes. This is the only
resource in this codebase where read access requires the same authorization as write access.

| Action | Who can |
|--------|---------|
| List (`GET /games/<slug>/tasks.json`) | **TaskEdit** — paginated, ordered by `id` (creation order) |
| Create (`POST /games/<slug>/tasks.json`) | Same as List |
| Update (`PATCH /games/<slug>/tasks/<id>.json`) | Same as List |
| Delete | Superuser only, via Django admin — no `DELETE` endpoint |

There is no standalone detail-`GET` endpoint — since every viewer of a task is already an editor
(List already returns the full item shape), a separate detail read path adds nothing.

## Fields

List/create-response/update-response (all share one shape): `id`, `short_description`,
`long_description`, `completed`, `session` (nullable `GameSession` id).

**Write fields** (create/update): `short_description` (required for create), `long_description`
(optional), `completed` (optional, defaults to `False`), `session` (optional, nullable —
settable/changeable/clearable). `game` is always server-assigned. `session`, when non-null, must
belong to the same game as the task, or `400`. Deleting a `GameSession` detaches (not deletes) its
tasks (`session` set to `null`) — a task outlives the session it was scoped to.
