# Upload.origin, index and photo max dimension setting

Add the persistence and configuration pieces the endpoints depend on.

- `Upload.origin`: `CharField(max_length=10, choices=[('regular', 'regular'), ('staff', 'staff')], default='regular')` with constants `ORIGIN_REGULAR` / `ORIGIN_STAFF`. Existing rows and init endpoints keep `regular`.
- Composite index on `Upload (content_type, object_id)` (`Meta.indexes`), in the **same** migration (`uploads/migrations/0002_...`). Keep `db_table = 'games_upload'`.
- Add a queryset/manager helper for "active uploads": `status in (pending, uploading)` and `expiration_time > now()`, filterable by `content_object` (content type + object id) and by a list of object ids — used by the list flag, the replace 409 and the deletable 422.
- `Settings.photo_max_dimension()` in `backend/games/settings.py`, `env_int('MAJORA_PHOTO_MAX_DIMENSION', 1024)` (clamp to ≥ 1). Document the env var where other `MAJORA_*` vars are documented (e.g. `.env` sample / docs, if present).
- Tests: model default `origin='regular'`; active-upload helper (pending/uploading not expired → active; uploaded or expired → not); setting default and override.

## Files to Change

- `backend/uploads/models.py` — `origin` field + constants, `Meta.indexes`, active-upload queryset helper.
- `backend/uploads/migrations/0002_upload_origin_and_index.py` — new migration.
- `backend/games/settings.py` — `photo_max_dimension()`.
- `backend/uploads/tests/models_test.py` — origin default, active-upload helper tests.
- `backend/games/tests/settings_test.py` (or the existing settings test module) — setting tests.
