# Keep the history table's status as varchar

`HistoricalRecords` copies `AuthorizationRequest.status` into `versioning.HistoricalAuthorizationRequest`; it must remain a plain `CharField` (the issue explicitly keeps the history column `varchar`).

Implement this in one reusable place, e.g. a small `HistoricalRecords` subclass in `backend/common/` (such as `common/history.py`) that overrides `copy_fields` (or `transform_field`) to replace any `EnumCharField` with an equivalent `models.CharField` (same `max_length`, `choices`, `default`, `db_default`, `null`, `blank`). Use it for `AuthorizationRequest.history`, keeping its existing args (`app='versioning'`, `user_db_constraint=False`). Prefer the simplest hook available in the installed `django-simple-history` version; check its source inside the container before choosing.

Verify that `makemigrations` generates **no** change for `versioning.HistoricalAuthorizationRequest.status`.

Test (e.g. in `backend/accounts/tests/models/authorization_request_test.py`): `AuthorizationRequest.history.model._meta.get_field('status')` is a `CharField` and **not** an `EnumCharField`.

## Files to Change
- `backend/common/history.py` (or similar) — `HistoricalRecords` subclass that downgrades `EnumCharField` to `CharField`.
- `backend/accounts/models/authorization_request.py` — use the subclass for `history`.
- `backend/accounts/tests/models/authorization_request_test.py` — history-field type test.
