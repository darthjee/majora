# Task

**[Game resource](principles.md#resource-categories).** Tasks are a DM-private checklist scoped to
a game (and optionally one of its `GameSession`s), mirroring `GameSession`'s "delegates edit
rights to its game" pattern (**TaskEdit**, which delegates to **GameEdit**). Deviates from every
other resource in this document: **Task has no public read path** — List and Detail are gated by
the same **TaskEdit** as Create/Update, since a task may hold DM-only prep notes. This is the only
resource in this codebase where read access requires the same authorization as write access.

| Action | Who can |
|--------|---------|
| List (`GET /games/<slug>/tasks.json`) | **TaskEdit** — paginated, ordered by `id` (creation order); filters below |
| Create (`POST /games/<slug>/tasks.json`) | Same as List |
| Detail (`GET /games/<slug>/tasks/<id>.json`) | Same as List |
| Update (`PATCH /games/<slug>/tasks/<id>.json`) | Same as List |
| Delete | Superuser only, via Django admin — no `DELETE` endpoint |

## Fields

List/create-response/update-response (all share one shape): `id`, `short_description`,
`long_description`, `completed`, `session` (nested `{id, title}` of the linked `GameSession`, or
`null`), `category`. Exposing the session `title` adds no leak: it is already public through the
[GameSession](game-session.md) list endpoints.

**Write fields** (create/update): `short_description` (required for create), `long_description`
(optional), `completed` (optional, defaults to `False`), `session` (optional, nullable integer
`GameSession` id — settable/changeable/clearable), `category` (optional; one of `printing`, `crafting`, `painting`,
`planning`, `writing`, `research`, `scheduling`, `buying`, `updating`, `other`; defaults to
`other` on create and is left unchanged when omitted from a `PATCH`; any other value, `null` or
`""` gives `400`). `game` is always server-assigned. `session`, when non-null, must
belong to the same game as the task, or `400`. Deleting a `GameSession` detaches (not deletes) its
tasks (`session` set to `null`) — a task outlives the session it was scoped to.

## List filters

All optional and combined with AND (and with `page`/`per_page`); an unrecognised value is
ignored rather than rejected. The queryset is always scoped to the URL's game first, so no filter
can surface another game's tasks.

- `category` — one of the category values above (case-sensitive).
- `completed` — `true`/`false` (case-insensitive).
- `session` — an integer `GameSession` id (only tasks linked to it; another game's id yields an
  empty list), or `none` (case-insensitive; only tasks with no session).
