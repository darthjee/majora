# Upload model: copy origin, new fields, failed status

Extend `Upload` in `backend/uploads/models.py`, using additive changes only:

- `ORIGIN_COPY = 'copy'`, added to `ORIGIN_CHOICES`, plus an `is_copy_origin` property next to `is_staff_origin`.
- `STATUS_FAILED = 'failed'`, added to `STATUS_CHOICES`.
- `ERROR_*` constants and `ERROR_CHOICES` for `source_missing`, `path_rejected`, `cross_device`, `target_exists`, `permission` and `unknown`.
- `source_path = CharField(max_length=512, null=True, blank=True)`.
- `is_cover = BooleanField(default=False)`.
- `error = CharField(max_length=32, choices=ERROR_CHOICES, null=True, blank=True)`.
- A `renew(user)` model method used by step 06. In a single `save()`, it:
  - sets a fresh `secrets.token_urlsafe(32)` token;
  - sets a fresh `expiration_time` (`Settings.upload_expiration_minutes()`), reusing the logic `save()` already has (extract a small helper rather than duplicating it);
  - sets `status = pending`;
  - clears `error`;
  - sets `user = user`.
- Leave `UploadQuerySet.active()` unchanged: it already ignores `failed` and expired uploads.

Generate the migration `0003_upload_copy_origin.py` through docker-compose (`makemigrations uploads`). Check that it only alters the choices and adds the nullable/defaulted columns.

Tests (`backend/uploads/tests/models_test.py`):
- defaults for the new fields;
- `is_copy_origin`;
- `renew()` rotates the token and expiry, resets status and error, and reassigns the user;
- `renew()` on an `uploaded` upload still raises, because the immutability rule is kept.

## Files to Change
- `backend/uploads/models.py` — new constants, fields, `is_copy_origin` and `renew()`.
- `backend/uploads/migrations/0003_upload_copy_origin.py` — new additive migration.
- `backend/uploads/tests/models_test.py` — model tests.
- `backend/uploads/tests/fixtures.py` — a helper to build a copy-origin upload, if useful for later steps.
