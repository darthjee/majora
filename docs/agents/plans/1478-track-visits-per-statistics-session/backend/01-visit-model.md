# Visit model, migration and admin

Add `Visit` to `backend/statistics/models.py`:

- `session = ForeignKey(Session, on_delete=CASCADE, related_name='visits')`
- `started_at = DateTimeField(default=timezone.now)` (or `auto_now_add=True`)
- `last_seen_at = DateTimeField(default=timezone.now)` — **not** `auto_now`, since the
  middleware sets it explicitly in an `UPDATE`
- `hits = PositiveIntegerField(default=1)`
- `Meta.indexes`: `Index(fields=['started_at'])` and
  `Index(fields=['session', 'last_seen_at'])`

Fix the `Session` docstring: it is the visitor (device/browser) identity, not "a single tracked
visit". Generate migration `0003_visit.py` (via docker-compose). Register `Visit` in
`statistics/admin.py` with the same read-only admin as `Session` (reuse/generalize
`ReadOnlySessionAdmin`, e.g. a `ReadOnlyStatisticsAdmin` base registered for both).

## Files to Change

- `backend/statistics/models.py` — add `Visit`, fix `Session` docstring
- `backend/statistics/migrations/0003_visit.py` — new migration
- `backend/statistics/admin.py` — register `Visit` read-only
