# Plan: FIX authorization_requests not found

Issue: [1039-fix-authorization-requests-not-found.md](../issues/1039-fix-authorization-requests-not-found.md)

## Overview

`POST /users/authorization_requests.json` and `POST /users/login.json` both only match
the submitted identifier against `User.username`, exactly and case-sensitively. This plan
makes both endpoints match against username OR email, case-insensitively, while keeping
`authorization_requests`' enumeration-safety guarantee intact. It also closes off the
underlying ambiguity going forward: registration lowercases `username`/`email` and rejects
`@` in new usernames, and a data migration normalizes existing data plus adds a DB-level
uniqueness constraint on email.

This is entirely backend work (Django views, validators, migrations, tests) — no other
agent is involved.

## Context

- `accounts/views/authorization_requests/create.py` currently does
  `User.objects.filter(username=username).first()`. If the caller sends an email instead of
  a username, no match is found, `user=None` is stored, and the request can never be
  approved — with no feedback that anything went wrong. The endpoint intentionally returns
  identical 201 responses regardless of match (enumeration-safety), so it cannot simply 404
  or reject unknown identifiers.
- `accounts/views/auth/login.py` has the same case-sensitive, username-only lookup problem
  via Django's default `authenticate()`/`ModelBackend`, so login would be inconsistent with
  the fixed `authorization_requests` endpoint once that's fixed.
- `User.email` (Django's built-in `auth.User` field) is not DB-unique today — only checked
  app-side at registration via `email_taken()` in `accounts/account_uniqueness.py`. Making
  the new email-based match safe against ambiguous results requires a DB-level unique
  constraint, added via raw SQL since `auth_user` belongs to `django.contrib.auth`, not one
  of this project's own apps.
- Confirmed (see issue): no pre-existing duplicate/blank emails and no existing
  case-variant username/email pairs in the current data, so the migrations in this plan can
  run unconditionally, with no collision-resolution step.
- The `accounts` app's latest migration is `0004_backfill_userprofile_status_approved.py`;
  new migrations start at `0005`.

## Implementation Steps

### Step 1 — Case-insensitive username-or-email matching in `create.py`

In `accounts/views/authorization_requests/create.py`, replace the single-field lookup:

```python
from django.db.models import Q

identifier = request.data.get('username', '')
if not identifier:
    return skip_cache(Response(MISSING_IDENTIFIER_ERROR, status=422))

user = User.objects.filter(Q(username__iexact=identifier) | Q(email__iexact=identifier)).first()
```

Add `MISSING_IDENTIFIER_ERROR = {'error': 'missing_identifier'}` to
`accounts/views/authorization_requests/_shared.py`, alongside the existing
`NOT_FOUND_ERROR`/`NOT_OPEN_ERROR`/`EXPIRED_ERROR`/`INVALID_CREDENTIALS_ERROR` constants,
and import it into `create.py`.

The rest of `create.py` (token creation, response shape, throttle, docstring) is unchanged.
Update the module docstring to mention the identifier can be a username or email.

### Step 2 — Same identifier resolution in `login.py`

In `accounts/views/auth/login.py`, resolve the identifier to the canonical username before
calling `authenticate()`, so Django's built-in password-checking/backend logic is untouched:

```python
from django.db.models import Q

identifier = request.data.get('username')
password = request.data.get('password')

matched = User.objects.filter(
    Q(username__iexact=identifier) | Q(email__iexact=identifier)
).first()
user = authenticate(
    request, username=matched.username if matched else identifier, password=password,
)
```

No change to the blank/missing-identifier behavior here — it already falls through to a 401
"Invalid credentials" via `authenticate()`, and login isn't the enumeration-sensitive
endpoint that motivated the 422 in Step 1.

### Step 3 — Registration: lowercase + reject `@` in usernames

In `accounts/views/auth/_shared.py`:

1. Add a `_normalize_register_payload(data)` helper that returns a new dict with `name` and
   `email` lowercased (guard with `isinstance(value, str)` before calling `.lower()`, since
   malformed payloads may send non-string values — leave those untouched so the existing
   validators reject them the same way they do today), and every other key/value copied
   as-is (including unexpected extra keys, so `_validate_required_fields`'s exact-keys check
   still behaves correctly).
2. Add a `_validate_username_format(data)` validator to the `validators` tuple in
   `_validate_register_payload` (alongside `_validate_email_format`, `_validate_unique_name`,
   etc.), returning an error message (e.g. `'username cannot contain @'`) when `'@' in
   data.get('name', '')`.
3. In `accounts/views/auth/register.py`, call `_normalize_register_payload(request.data)`
   first, then pass the normalized dict through both `_validate_register_payload` and
   `_create_registered_user` (instead of passing `request.data` to each directly).

Because normalization happens before validation, the existing exact-match uniqueness checks
(`username_taken`, `email_taken` in `accounts/account_uniqueness.py`) become case-insensitive
for free — no changes needed there. `display_name` is untouched by any of this.

### Step 4 — Data migration: lowercase existing usernames/emails

New file `backend/accounts/migrations/0005_lowercase_username_email.py`, depending on
`("accounts", "0004_backfill_userprofile_status_approved")` and
`migrations.swappable_dependency(settings.AUTH_USER_MODEL)`. Follow the existing
`RunPython` convention used by
`games/migrations/0062_backfill_userprofile_display_name.py`
(`_backfill_<x>(apps, schema_editor)` forward function + `_noop_reverse` for the reverse,
both operating through `apps.get_model('auth', 'User')`, not a direct import, since this
is a historical-state migration):

```python
def _lowercase_username_email(apps, schema_editor):
    User = apps.get_model('auth', 'User')
    for user in User.objects.all():
        lowered_username = user.username.lower()
        lowered_email = user.email.lower()
        if lowered_username != user.username or lowered_email != user.email:
            user.username = lowered_username
            user.email = lowered_email
            user.save(update_fields=['username', 'email'])


def _noop_reverse(apps, schema_editor):
    pass
```

### Step 5 — Migration: DB-level unique constraint on email

New file `backend/accounts/migrations/0006_auth_user_email_unique.py`, depending on
`0005_lowercase_username_email` from Step 4 (so the constraint is added only after existing
data is normalized). Follow the `RunSQL` convention used by
`domains/migrations/0001_initial.py`, targeting the raw `auth_user` table (this can't go
through a `AlterField`/`unique=True` model-state operation since `auth.User` isn't one of
this project's own app models):

```python
migrations.RunSQL(
    sql="ALTER TABLE auth_user ADD CONSTRAINT auth_user_email_unique UNIQUE (email);",
    reverse_sql="ALTER TABLE auth_user DROP INDEX auth_user_email_unique;",
),
```

### Step 6 — Tests

- `accounts/tests/authorization_requests/create_test.py` (extend the existing
  `TestAuthorizationRequestCreateView` class):
  - `test_returns_201_for_known_email`
  - `test_creates_request_linked_to_the_matching_user_by_email`
  - `test_matches_username_case_insensitively`
  - `test_matches_email_case_insensitively`
  - `test_missing_username_returns_422`
  - `test_blank_username_returns_422`
  - existing tests (`test_unknown_username_returns_identical_status_and_shape`, etc.) stay
    unchanged — verify they still pass, since they prove enumeration-safety is preserved.
- `accounts/tests/auth/register_test.py` (extend `TestRegisterView`):
  - `test_rejects_username_containing_at_symbol`
  - `test_lowercases_username_on_registration`
  - `test_lowercases_email_on_registration`
  - `test_rejects_duplicate_name_differing_only_by_case`
  - `test_rejects_duplicate_email_differing_only_by_case`
- `accounts/tests/auth/login_test.py` (extend `TestLoginView`):
  - `test_returns_token_for_email_login`
  - `test_returns_token_for_case_insensitive_username`
  - `test_returns_token_for_case_insensitive_email`
- New file `accounts/tests/models/lowercase_username_email_migration_test.py`, mirroring
  `games/tests/models/user_profile_display_name_migration_test.py`'s pattern
  (`historical_apps('accounts', '0005_lowercase_username_email')` + calling
  `_lowercase_username_email`/`_noop_reverse` directly):
  - lowercases an existing mixed-case username/email
  - leaves an already-lowercase username/email untouched
  - reverse migration is a no-op

## Files to Change

- `backend/accounts/views/authorization_requests/create.py` — case-insensitive
  username-or-email lookup, 422 on missing/blank identifier
- `backend/accounts/views/authorization_requests/_shared.py` — add
  `MISSING_IDENTIFIER_ERROR`
- `backend/accounts/views/auth/login.py` — resolve identifier via the same
  username-or-email, case-insensitive lookup before calling `authenticate()`
- `backend/accounts/views/auth/_shared.py` — add `_normalize_register_payload` and
  `_validate_username_format`, wire the latter into `_validate_register_payload`
- `backend/accounts/views/auth/register.py` — normalize `request.data` before validating/
  creating
- `backend/accounts/migrations/0005_lowercase_username_email.py` — new data migration
- `backend/accounts/migrations/0006_auth_user_email_unique.py` — new raw-SQL migration
- `backend/accounts/tests/authorization_requests/create_test.py` — new test cases
- `backend/accounts/tests/auth/register_test.py` — new test cases
- `backend/accounts/tests/auth/login_test.py` — new test cases
- `backend/accounts/tests/models/lowercase_username_email_migration_test.py` — new file

## CI Checks

- `backend`: `poetry run pytest --ignore=games/tests/views/ --cov --cov-report=lcov:coverage/lcov.info` (CI job covering `accounts/tests/`)
- `backend`: `poetry run ruff check .` (lint)

## Notes

- The unique constraint name `auth_user_email_unique` is a placeholder — confirm it doesn't
  collide with any existing index name in the `auth_user` table before applying.
- `_lowercase_username_email` iterates and saves row-by-row rather than a bulk `UPDATE`, to
  stay in the established `RunPython` convention used elsewhere in this codebase; the `auth_user`
  table is expected to be small enough that this isn't a performance concern.
- No frontend changes: no frontend code references `authorization_requests`, `login`, or
  `register` in a way that assumes email addresses are rejected as identifiers.
