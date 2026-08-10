# Backend Plan: Use custom cache hash for some restricted endpoints

Main plan: [plan.md](plan.md)

## Shared contracts

- Produce a `cache_token` field (string) on both `POST /users/login.json` and `GET /users/status.json`'s logged-in payload, sourced from a new `CacheToken` model — same key format/length as the existing `token` field.
- `GET /staff/cache/summary.json` itself (`backend/staff/views/staff_cache_summary.py`) is **not touched** by this issue — it keeps sending `X-Skip-Cache: true` unchanged. Do not modify it.

## Implementation Steps

### Step 1 — Add the `CacheToken` model

New file `backend/accounts/models/cache_token.py`, following the same pattern as `backend/accounts/models/password_reset_token.py` (own file, `ForeignKey`/`OneToOneField` to `User`, own `db_table`):

```python
"""CacheToken model for Majora RPG Campaign Management System."""

import binascii
import os

from django.contrib.auth.models import User
from django.db import models


def _generate_key():
    """Generate a random 40-char hex key, mirroring rest_framework.authtoken.models.Token."""
    return binascii.hexlify(os.urandom(20)).decode()


class CacheToken(models.Model):
    """Model representing a per-user credential used only to key the proxy's private cache.

    Deliberately never consulted by any backend authentication class
    (`CookieTokenAuthentication` et al.) — even an unhashed leak of this
    value can never authenticate a real (mutating) backend request. It only
    ever has meaning as private-cache hash input on the Tent proxy side.
    """

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='cache_token')
    key = models.CharField(max_length=40, unique=True, default=_generate_key)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        """Metadata for the CacheToken model."""

        db_table = 'accounts_cachetoken'
```

One `CacheToken` per user (`OneToOneField`, mirroring `rest_framework.authtoken.models.Token`'s one-per-user design) — `get_or_create(user=...)` at mint time gives idempotent behavior across repeated login/status calls, exactly like the existing `Token` handling in `login.py`.

Register it in `backend/accounts/models/__init__.py`'s imports and `__all__`, alongside `AuthorizationRequest`/`PasswordResetToken`/`UserProfile`.

### Step 2 — Migration

Generate via `python manage.py makemigrations accounts` (or hand-write following the numbering convention — next after `0006_auth_user_email_unique.py` is `0007_cachetoken.py`).

### Step 3 — Mint at login

`backend/accounts/views/auth/login.py`: after the existing `token, _ = Token.objects.get_or_create(user=user)` line, add:

```python
cache_token, _ = CacheToken.objects.get_or_create(user=user)
```

and extend the final response to `Response({'token': token.key, 'cache_token': cache_token.key})`.

### Step 4 — Mint at status (bootstrap)

`backend/accounts/views/auth/status.py`: in `_build_logged_in_payload`, add the `CacheToken` `get_or_create` and include `cache_token` in the returned payload — **unconditionally** for any logged-in response (not gated behind `session_auth` the way the existing `token` field is), since a cache token needs to be (re)established on every bootstrap call regardless of which authentication path resolved the user. Thread the token through the same way `token_obj`/`profile` already are.

### Step 5 — Invalidate at logout

`backend/accounts/views/auth/logout.py`: alongside the existing `Token.objects.filter(user=request.user).delete()`, add:

```python
CacheToken.objects.filter(user=request.user).delete()
```

so both credentials are revoked together — "logout = immediately unreachable" applies to the cache token exactly as it already does to the auth token.

### Step 6 — Tests

- `backend/accounts/tests/models/` — new test file for `CacheToken` (mirror the existing `PasswordResetToken` model test): key generation, uniqueness, one-per-user via `get_or_create`.
- `backend/accounts/tests/auth/` — extend the existing login/status/logout view tests to assert: `cache_token` appears in the login response; `cache_token` appears in status's logged-in payload; a second `get_or_create` call (e.g. two status calls in the same session) returns the same key; logout deletes the `CacheToken` row (a subsequent status/login mints a fresh key).

Consider whether `CacheToken` needs a Django admin registration (`backend/accounts/admin.py`) for staff visibility/debugging — check whether `PasswordResetToken` is registered there and follow the same call.

## Files to Change

- `backend/accounts/models/cache_token.py` — new model
- `backend/accounts/models/__init__.py` — export `CacheToken`
- `backend/accounts/migrations/0007_cachetoken.py` — new migration
- `backend/accounts/views/auth/login.py` — mint + return `cache_token`
- `backend/accounts/views/auth/status.py` — mint + return `cache_token` in logged-in payload
- `backend/accounts/views/auth/logout.py` — delete `CacheToken` row
- `backend/accounts/tests/models/` — new `CacheToken` model test
- `backend/accounts/tests/auth/` — extend login/status/logout tests
- `backend/accounts/admin.py` — optional, if `PasswordResetToken` is registered there

## CI Checks

- `backend`: `poetry run pytest --ignore=games/tests/views/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_all`)
- `backend`: `poetry run ruff check .` (CI job: `checks`)

## Notes

- `staff_cache_summary.py` is explicitly out of scope for this issue — do not remove or alter its `X-Skip-Cache: true` header; the proxy plan handles ignoring it for this one rule.
- `data-access` and `security` are read-only reviewers configured for this project — expect their review on the `cache_token` field additions (new sensitive-ish data on existing authenticated responses) even though they don't get their own plan file here.
