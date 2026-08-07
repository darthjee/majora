# Historical records (`versioning` app)

`django-simple-history` generates one `Historical<Model>` table per tracked model — `Game`,
`Player`, `Character`, `Treasure`, `CharacterTreasure`, `GamePhoto`, `CharacterPhoto`, `Link`,
`CharacterLink`, `TreasurePhoto`, `StlModel`, `StlModelLink`, `StlModelPhoto`, `Source`, `Tag`
(see [`architecture.md`](../architecture.md)'s `versioning/` section). `GameTreasure` is not
tracked.

These tables carry the full field state of every tracked model at every past save/delete, plus
`history_user` (the acting user, when known). **They are exposed only via Django Admin — never
through any API endpoint or serializer.** A future issue that wants to surface history through the
API would need its own dedicated review and its own entry in this document.

**`history_user` has no DB-level foreign-key constraint** — deliberately, to avoid MySQL deadlocks
under the test suite. Integrity of `history_user_id` after a user is deleted relies on the
deletion going through Django's ORM (still runs the `SET_NULL` behavior via its own signal
machinery) rather than a DB-level constraint — true for every current user-deletion path in this
codebase. A future raw-SQL or bulk user-purge tool should explicitly null out `history_user_id` on
these tables (or reuse Django's ORM delete) to avoid an orphaned reference — a data-integrity
nuance, not a crash or disclosure risk (a missing user resolves to `None` gracefully).
