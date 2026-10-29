# Migration and model fields

Add the columns, all nullable with no backfill (existing rows stay `NULL` = unknown):

- `Session.first_path` — `CharField(max_length=255, null=True, blank=True)`.
- `Session.creation_reason` — `CharField(max_length=32, null=True, blank=True)` with a
  `models.TextChoices` class (`CreationReason`): `no_cookie`, `invalid_cookie`,
  `cookie_session_not_found`, `domain_changed`, `ip_changed`, `login_rotation`.
- `Session.first_seen_logged` — `BooleanField(null=True, blank=True)`.
- `Visit.first_path`, `Visit.last_path` — `CharField(max_length=255, null=True, blank=True)`.

Generate the migration through docker-compose (`makemigrations statistics`) and add model tests
for the new fields and choices.

## Files to Change

- `backend/statistics/models.py` — new fields and `Session.CreationReason`.
- `backend/statistics/migrations/0004_session_visit_tracking_columns.py` — new migration.
- `backend/statistics/tests/models/` — field/choice tests.
