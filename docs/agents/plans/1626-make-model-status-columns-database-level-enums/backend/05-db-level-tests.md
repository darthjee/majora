# Database-level tests and migration check

Add tests proving the database itself now enforces the values (the hand-edit scenario):

- One test per model (`AuthorizationRequest`, `UserProfile`, `Upload`, `Poll`), in its existing model test file: create a valid row, then run a raw `UPDATE <table> SET status='bogus' WHERE id=%s` through `connection.cursor()` and assert it raises `django.db.utils.DataError` (or the matching `OperationalError`/`IntegrityError` that MySQL strict mode raises — assert on whichever the driver actually maps it to). Wrap in `transaction.atomic()` so the failure doesn't poison the test transaction.
- `UserProfile`: a raw `INSERT` omitting `status` yields `pending` (DB default).
- Run the full backend suite: existing authorization-request (including the `approved` → `logged` race test), user-profile (including the status migration tests), upload and poll tests must pass unchanged.
- `poetry run python manage.py makemigrations --check --dry-run` is clean.

## Files to Change
- `backend/accounts/tests/models/authorization_request_test.py` — DB rejection test.
- `backend/accounts/tests/models/user_profile_test.py` — DB rejection + DB default tests.
- `backend/uploads/tests/models_test.py` — DB rejection test.
- `backend/games/tests/models/poll/poll_test.py` — DB rejection test.
