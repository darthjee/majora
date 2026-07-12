# Historical records (`versioning` app)

`django-simple-history` generates one `Historical<Model>` table per tracked model — `Game`,
`Player`, `Character`, `Treasure`, `CharacterTreasure`, `GamePhoto`, `CharacterPhoto`, `Link`,
`CharacterLink`, `TreasurePhoto` — living in the `versioning` app (see
[`docs/agents/architecture.md`](../architecture.md)'s "`versioning/`" section). `GameTreasure` is not tracked.

These tables carry the full field state of every tracked model at every past save/delete, plus
`history_user` (the acting user, when known). **They are exposed only via Django Admin — out of
scope per this document's own rule above — and never through any API endpoint or serializer.**
There is no read or write path to a `Historical<Model>` row from any client-facing route; a
future issue that wants to surface history through the API would need its own dedicated review
and its own entry in this document.

**`history_user` has no DB-level foreign-key constraint** (`user_db_constraint=False` on every
`HistoricalRecords(...)` call) — required to avoid MySQL deadlocks under the `games/tests/views/`
suite (a hard FK from ten `Historical<Model>` tables to `auth_user` caused intermittent deadlock
failures; disabling the constraint resolved them, matching the "loose FK" treatment
`django-simple-history` already applies by default to the tracked model's own relations, e.g.
`game`/`player`/`profile_photo`). Integrity of `history_user_id` after a user is deleted
therefore relies on the deletion going through Django's ORM (`on_delete=models.SET_NULL` still
runs via Django's own signal/collector machinery, independent of `db_constraint`) rather than a
DB-level constraint — true for every current user-deletion path in this codebase. If a future
raw-SQL or bulk user-purge tool is ever added, it should explicitly null out `history_user_id` on
the ten `Historical<Model>` tables (or reuse Django's ORM delete) to avoid an orphaned reference;
`_history_user_getter` already handles a missing user gracefully (returns `None`), so this
remains a data-integrity nuance, not a crash or disclosure risk.
