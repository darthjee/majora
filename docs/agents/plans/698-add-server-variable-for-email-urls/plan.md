# Plan: Add Server Variable For Email URLs

Issue: [698-add-server-variable-for-email-urls.md](../issues/698-add-server-variable-for-email-urls.md)

## Overview
Introduce a dedicated, unit-tested class that normalizes the existing `FRONTEND_BASE_URL` setting (default scheme, no trailing slash) into a safe base to build links from, and use it inside the single shared function that both the password-reset email and the staff "generate recovery link" action already call.

## Context
- `FRONTEND_BASE_URL` is defined in `backend/majora_project/settings.py:120` (`os.environ.get('FRONTEND_BASE_URL', 'http://localhost:3000')`).
- Both link-generating flows already funnel through one function, `build_recovery_url(token)` in `backend/games/views/password_reset/_shared.py`, which today does raw string concatenation: `f'{settings.FRONTEND_BASE_URL}/#/recover-password?token={token}'`.
  - Used by `send_password_reset_email()` in the same file (password-reset email flow).
  - Used directly by `backend/games/views/staff/staff_user_recovery_link.py` (staff "generate recovery link" action).
- Because there is a single shared call site, making `build_recovery_url()` use the new class is sufficient to guarantee both flows never diverge — no other call sites need to change.
- `.env.prod` in this repo is a local, git-ignored file (used only to pull data from production) and is explicitly out of scope — do not create, edit, or reference it. Only `.env.dev.sample` (tracked) should be touched for documentation purposes.
- Existing app-level env-reading pattern: `backend/games/settings.py` has a single `Settings` class with `@staticmethod` accessors, one per env var. The new class should live as its own small module at the same app-root level (`backend/games/`), following that same "single dedicated place" convention, rather than being folded into `_shared.py`.
- Test convention: tests mirror the source path 1:1 with a `_test.py` suffix (e.g. `backend/games/tests/url_builder_test.py` for `backend/games/url_builder.py`), each directory has `__init__.py`.

## Implementation Steps

### Step 1 — Add the URL-builder class
Create `backend/games/url_builder.py` with a `FrontendBaseUrl` class that wraps `settings.FRONTEND_BASE_URL` and exposes a `build()` method returning the normalized base:
- Accept an optional raw value override in `__init__` (defaulting to `settings.FRONTEND_BASE_URL`) so tests can exercise every input format directly, without monkeypatching Django settings.
- `build()` normalization rules:
  - Strip whitespace.
  - If the value has no `://`, prepend `https://`.
  - Strip any trailing `/`.
- This must correctly normalize all of: `https://server.com:80`, `https://server.com:80/`, `https://server.com`, `https://server.com/`, `server.com`, `server.com/`.

Example shape:
```python
from django.conf import settings


class FrontendBaseUrl:
    """Normalizes FRONTEND_BASE_URL into a scheme-qualified base with no trailing slash."""

    def __init__(self, raw_value=None):
        self._raw_value = settings.FRONTEND_BASE_URL if raw_value is None else raw_value

    def build(self):
        base = self._raw_value.strip()
        if '://' not in base:
            base = f'https://{base}'
        return base.rstrip('/')
```

### Step 2 — Use the class in `build_recovery_url()`
Update `backend/games/views/password_reset/_shared.py`:
- Import `FrontendBaseUrl` from `games.url_builder`.
- Replace `f'{settings.FRONTEND_BASE_URL}/#/recover-password?token={token}'` with `f'{FrontendBaseUrl().build()}/#/recover-password?token={token}'`.
- Drop the now-unused `from django.conf import settings` import from this file if nothing else in it still needs `settings`.

### Step 3 — Unit tests for the class
Create `backend/games/tests/url_builder_test.py` covering `FrontendBaseUrl(<raw_value>).build()` for each of the six input formats listed in the issue's Expected Behavior, asserting they all normalize to the equivalent `https://server.com` (or `https://server.com:80` when a port is present) base. Also cover the default-to-`FRONTEND_BASE_URL`-setting path (no `raw_value` passed) with `settings.FRONTEND_BASE_URL` overridden via Django's `override_settings`/`settings` test fixture, matching whatever pattern existing tests in this app use for settings overrides.

### Step 4 — Regression-check existing callers
Run (or re-review) the existing tests that already cover these two flows to confirm no behavior regression:
- `backend/games/tests/password_reset/recover_test.py` (or wherever `send_password_reset_email`/`build_recovery_url` is exercised for the email flow)
- `backend/games/tests/views/staff/staff_user_recovery_link_test.py`

### Step 5 — Document the environment variable
- In `.env.dev.sample`, tighten the comment above `FRONTEND_BASE_URL` (currently just "# Frontend settings") to state explicitly that this variable controls the base URL used in password-reset emails and the staff recovery-link action, and that it accepts a bare domain or a full `scheme://host[:port]` value.
- Do not touch `.env.prod` (git-ignored, unrelated to real production configuration — see Context above).

## Files to Change
- `backend/games/url_builder.py` — new `FrontendBaseUrl` class (normalization logic).
- `backend/games/tests/url_builder_test.py` — new unit tests for every input format.
- `backend/games/views/password_reset/_shared.py` — use `FrontendBaseUrl` in `build_recovery_url()` instead of raw string concatenation.
- `.env.dev.sample` — clearer comment documenting `FRONTEND_BASE_URL`'s purpose and accepted formats.

## CI Checks
- `backend`: `poetry run pytest --ignore=games/tests/views/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_all`) — covers the new `games/tests/url_builder_test.py`.
- `backend`: `poetry run pytest games/tests/views/ --ignore=games/tests/views/game/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest`) — covers `staff_user_recovery_link_test.py` and the password-reset view tests.
- `backend`: `poetry run ruff check .` (CI job: lint) — line length limit is 100 characters.

## Notes
- The PR description should explicitly name `FRONTEND_BASE_URL` as the environment variable controlling this domain, per the issue's requirement, since it cannot be documented in `.env.prod`.
- No frontend, infra, or proxy changes are needed — this is backend-only.
