# Issue: FIX authorization_requests not found

## Description
The passwordless authorization-request endpoint (`POST /users/authorization_requests.json`) matches the submitted identifier only against `User.username`. If the caller supplies their email address instead of their username, the lookup finds no match, so the request is created with `user=None` — and can never be approved, since there is no user to approve it from — with no feedback to the caller that they made a mistake.

## Problem
- The endpoint intentionally cannot return `404` for an unmatched identifier — that would let an attacker enumerate valid usernames — and it cannot fail hard either.
- It also cannot infer "this looks like an email, not a username" from format alone, since usernames are historically allowed to contain `@`.
- The same case-sensitive, username-only lookup problem exists in `accounts/views/auth/login.py`: a user could request a passwordless login with `ALICE` or their email, but not actually log in with either.

## Expected Behavior
- Submitting either a username or an email address (in any letter case) to `POST /users/authorization_requests.json` resolves to the matching user when one exists, with the exact same response shape/status regardless of match (enumeration-safe).
- A missing/blank identifier is rejected with `422 {'error': 'missing_identifier'}` — a client-error case, not an enumeration concern.
- Logging in via `POST /users/login.json` accepts the same username-or-email, case-insensitive identifier.
- New user registration always stores `username`/`email` in lowercase, and rejects usernames containing `@` — closing off future ambiguity between the two match paths.

## Solution

### Matching semantics
In `accounts/views/authorization_requests/create.py`, replace the single-field lookup with an OR across both fields, in one query:

```python
from django.db.models import Q

user = User.objects.filter(Q(username__iexact=identifier) | Q(email__iexact=identifier)).first()
```

This keeps the existing enumeration-safety guarantee (same 201 response shape regardless of match).

- **Missing/blank identifier.** If the `username` field is missing or empty, return `422` with an error body consistent with this endpoint family's existing pattern (e.g. `{'error': 'missing_identifier'}`, matching `NOT_OPEN_ERROR`/`EXPIRED_ERROR` in `_shared.py`). This is a client-error case (nothing was submitted to look up), not an enumeration concern, so it does not need to stay indistinguishable from the "no match" case.
- **Email uniqueness.** `User.email` is Django's built-in `auth.User` field and is not DB-unique today — only checked at registration time via `email_taken()` (app-level, and doesn't cover pre-existing data). To make the new email-based match safe against ambiguous results (`.first()` picking an arbitrary user), add a DB-level unique constraint on `auth_user.email` (via a raw-SQL migration, since that table belongs to `django.contrib.auth`, not one of this project's own apps). Confirmed: no pre-existing duplicate/blank emails exist in the current data, so no cleanup/backfill step is needed before this constraint lands.
- **Registration: reject `@` in usernames.** Add a new validator to the existing pipeline in `accounts/views/auth/_shared.py`'s `_validate_register_payload` (alongside `_validate_email_format`, `_validate_unique_name`, etc.), rejecting any `name` containing `@`. This closes off the case the original issue flagged ("we cannot validate as the username could contain '@'") going forward for newly-registered accounts. Existing usernames containing `@` are unaffected and still work correctly against the OR-based query above.

### Case sensitivity
- Matching is case-insensitive on both fields (see the `__iexact` query above).
- Registration forces lowercase storage going forward: `accounts/views/auth/_shared.py` lowercases `name` and `email` as soon as the payload is received, before validation runs — so the existing exact-match uniqueness checks (`username_taken`, `email_taken`) become case-insensitive for free, and `_create_registered_user` always persists lowercase values. `display_name` is untouched (this only concerns the login identifiers, not the display name).
- A data migration lowercases every existing `User.username` and `User.email`. Confirmed: no existing users differ only by case (e.g. no `Alice`/`alice` pair, no two emails differing only by case), so this can run unconditionally — no collision-resolution step needed. This also means the plain (non-functional) unique index on `auth_user.email` above is sufficient; no need for a `LOWER(email)` functional index.

### Scope: also fix login
This fix extends to `accounts/views/auth/login.py`, which has the exact same underlying problem (case-sensitive, username-only lookup via Django's default `authenticate()`/`ModelBackend`) — without this, login would be inconsistent with the newly-fixed authorization-requests endpoint.

Resolve the identifier to the canonical username first, then hand that to `authenticate()` unchanged, so Django's built-in password-checking/backend logic is untouched — this only fixes identifier resolution, not credential verification:

```python
identifier = request.data.get('username')
password = request.data.get('password')

matched = User.objects.filter(
    Q(username__iexact=identifier) | Q(email__iexact=identifier)
).first()
user = authenticate(request, username=matched.username if matched else identifier, password=password)
```

A blank/missing `username` on login is **not** changed to 422 — it already correctly falls through to a 401 "Invalid credentials" via `authenticate()`, and login isn't the enumeration-sensitive endpoint that motivated the 422 decision for authorization-requests.

### Test coverage
- `accounts/tests/authorization_requests/create_test.py` (extending the existing suite):
  - `test_returns_201_for_known_email` / `test_creates_request_linked_to_the_matching_user_by_email`
  - `test_matches_username_case_insensitively` (e.g. request with `'ALICE'` matches user `'alice'`)
  - `test_matches_email_case_insensitively`
  - `test_missing_username_returns_422` / `test_blank_username_returns_422` (error shape `{'error': 'missing_identifier'}`)
  - existing enumeration-safety tests (`test_unknown_username_returns_identical_status_and_shape`, etc.) stay as-is and continue to prove the guarantee holds
- `accounts/tests/auth/register_test.py` (extending):
  - `test_rejects_username_containing_at_symbol`
  - `test_lowercases_username_on_registration` / `test_lowercases_email_on_registration`
  - `test_rejects_duplicate_name_differing_only_by_case` / `test_rejects_duplicate_email_differing_only_by_case`
- New migration test file, mirroring the existing convention (e.g. `user_profile_display_name_migration_test.py`'s use of `historical_apps` + calling the migration's forward function directly):
  - lowercases an existing mixed-case username/email
  - leaves already-lowercase values untouched
  - reverse migration is a no-op, consistent with the other data migrations in this repo
- `accounts/tests/auth/login_test.py` (extending):
  - `test_returns_token_for_email_login`
  - `test_returns_token_for_case_insensitive_username`
  - `test_returns_token_for_case_insensitive_email`

## Benefits
- Users who mistype their identifier type (email vs username) get a working match instead of a silently-broken, unapprovable request.
- Case-insensitive matching removes a common source of confusing "no match"/"invalid credentials" failures caused by letter-case mismatches.
- Enforced lowercase storage plus `@`-rejection at registration closes off the ambiguity permanently for new accounts.
- Login and authorization-requests behave consistently with each other.
