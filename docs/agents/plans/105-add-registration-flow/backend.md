# Backend Plan: Add registration flow

Main plan: [plan.md](plan.md)

## Shared contracts

Implements the `POST /users/register.json` contract and the `EMAILS_ENABLED` gating described in
[plan.md](plan.md#shared-contracts). Produces the `{"username": ..., "token": ...}` response shape
the frontend relies on for auto-login.

## Implementation Steps

### Step 1 — Add `Settings.emails_enabled()`

In `source/games/settings.py`, add a static method mirroring the existing pattern:

```python
@staticmethod
def emails_enabled():
    """Return True only when email sending has been explicitly enabled."""
    return os.environ.get('EMAILS_ENABLED', 'false').lower() == 'true'
```

### Step 2 — Gate all `send_mail` call sites behind the new setting

Update `source/games/views/auth.py` (`send_test_email`) and `source/games/views/password_reset.py`
(`send_password_reset_email`) to no-op when `Settings.emails_enabled()` is `False` — wrap the existing
`send_mail(...)` call in an `if Settings.emails_enabled():` guard rather than changing any other
behavior (responses must stay the same either way). Add the welcome email (Step 4) behind the same
guard from the start.

### Step 3 — Rewrite the `register` view with strict validation and auto-login

In `source/games/views/auth.py`, replace the current `register` view:

- Accept exactly `name`, `email`, `password`, `password_confirmation`. Reject the request with `400`
  and a descriptive `{"error": ...}` if any unexpected key is present in `request.data`, or if any of
  the four required fields is missing/empty.
- Validate `email` format using Django's `django.core.validators.validate_email` (catch
  `ValidationError` → `400 {"error": "invalid email"}`).
- Validate `password == password_confirmation` (`400` on mismatch).
- Validate uniqueness of both `name` (as `username`) and `email` (`400` on either collision) — reuse
  `User.objects.filter(...).exists()` checks, matching the existing duplicate-username check style.
- Do not validate password strength (explicitly out of scope per the issue).
- On success: create the user via `User.objects.create_user(username=name, email=email,
  password=password)`, create/get an auth `Token` for the user (same call as `login`), send the
  welcome email (Step 4), and return `Response({'username': user.username, 'token': token.key},
  status=201)`.

### Step 4 — Welcome email

Add `send_welcome_email(user)` in `source/games/views/auth.py`, following the existing
`send_test_email`/`send_password_reset_email` pattern: render a new template
`games/welcome_email.txt` (simple text, no confirmation link — e.g. "Welcome to Majora, {{
username }}!") and `send_mail(...)`, gated by `Settings.emails_enabled()` as per Step 2. Call it from
the `register` view after the user is created.

### Step 5 — Tests

Extend `source/games/tests/auth_test.py` `TestRegisterView`:
- Registering with valid `name`/`email`/`password`/`password_confirmation` returns `201` with
  `username` and `token` in the body, and a `Token` exists for the created user.
- Rejects: missing any of the four fields, mismatched password/confirmation, invalid email format,
  duplicate email, duplicate name, and an unexpected extra field in the payload — each asserting
  `400`.
- Welcome email is sent to `mail.outbox` on success when `EMAILS_ENABLED=true` (use
  `monkeypatch.setenv` / `settings` override) and is **not** sent when unset/`false`.
- Add equivalent on/off coverage to the existing password-reset and test-email tests to confirm they
  also respect `EMAILS_ENABLED`.

## Files to Change
- `source/games/settings.py` — add `emails_enabled()`.
- `source/games/views/auth.py` — gate `send_test_email`; rewrite `register`; add `send_welcome_email`.
- `source/games/views/password_reset.py` — gate `send_password_reset_email`.
- `source/games/templates/games/welcome_email.txt` — new welcome email template.
- `source/games/tests/auth_test.py` — new/updated test coverage.

## CI Checks
- `source/`: `poetry run pytest --cov` (CI job: `pytest`)
- `source/`: `poetry run ruff check .` (CI job: `checks` — "Check python Lint")

## Notes
- `name` maps to Django's `User.username`; there is no separate display-name field on the user model,
  matching the existing `login`/`status` convention of identifying users by `username`.
- Password strength validation is explicitly deferred per the issue clarification.
