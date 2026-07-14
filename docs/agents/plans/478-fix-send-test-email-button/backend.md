# Backend Plan: Fix send test email button

Main plan: [plan.md](plan.md)

## Shared contracts

- `POST /users/test-email.json` (`backend/games/views/auth/email.py`) must reject callers
  who are authenticated but not staff/superuser with `403`
  `{"errors": {"detail": ["not allowed"]}}`, and unauthenticated callers with `401`
  `{"errors": {"detail": ["authentication required"]}}` — both already produced by
  `require_staff` in `backend/games/views/common.py`. The success/validation response
  shapes (`{"sent": true}`, the 400 "no email" body) are unchanged.

## Implementation Steps

### Step 1 — Gate the endpoint with `require_staff`

In `backend/games/views/auth/email.py`:
- Drop the `IsAuthenticated` permission class/import.
- Switch `permission_classes` to `AllowAny` (matching the pattern already used in
  `backend/games/views/staff/staff_users_list.py`), with a short comment explaining that
  auth/authorization is enforced inline via `require_staff` so unauthenticated/non-staff
  callers get a proper 401/403 (copy the existing comment style from
  `staff_users_list.py`).
- Import `require_staff` from `..common` and call it first in `test_email`, returning its
  error response immediately if non-`None`, before the existing "no email configured"
  check.
- No `authentication_classes` override is needed — `REST_FRAMEWORK.DEFAULT_AUTHENTICATION_CLASSES`
  in `backend/majora_project/settings.py` already includes `CookieTokenAuthentication`,
  which also accepts the `Token <key>` header used by the existing tests.

### Step 2 — Update/add tests

In `backend/games/tests/auth/test_email_test.py`:
- Keep `test_requires_authentication` as-is (still expects 401 for a fully anonymous
  request — now produced by `require_staff` -> `require_authenticated` instead of DRF's
  `IsAuthenticated`).
- Add a new test asserting that an authenticated, non-staff/non-superuser user (plain
  `UserFactory(...)`, no `is_staff`/`is_superuser` override) gets `403` with
  `{"errors": {"detail": ["not allowed"]}}` and that `mail.outbox` stays empty.
- Update the existing "happy path" tests (`test_sends_email_for_user_with_email`,
  `test_does_not_send_email_when_emails_disabled`, `test_rejects_user_without_email`) to
  create their user with `is_staff=True` (or `is_superuser=True`) via `UserFactory`, since
  a plain user would now be rejected by `require_staff` before reaching the
  email/no-email logic. Check `games/tests/factories.py` for the right `UserFactory`
  kwarg name(s) for staff/superuser flags before wiring this in.

## Files to Change

- `backend/games/views/auth/email.py` — replace `IsAuthenticated` with an inline
  `require_staff(request)` check (`AllowAny` + early-return pattern).
- `backend/games/tests/auth/test_email_test.py` — mark existing happy-path test users as
  staff/superuser, add a new 403-for-non-staff test.

## CI Checks

- `backend`: `docker-compose run --rm majora_tests pytest` (CI job: `pytest_all`, since
  `games/tests/auth/` falls outside `games/tests/views/` and is picked up by the
  `--ignore=games/tests/views/` catch-all job rather than `pytest_views_rest`).
- `backend`: `docker-compose run --rm majora_tests ruff check .` (CI job: `checks`).

## Notes

- Confirm `UserFactory`'s exact keyword(s) for staff/superuser (e.g. `is_staff=True`,
  `is_superuser=True`) by reading `backend/games/tests/factories.py` before editing the
  tests — do not guess the trait name.
- `data-access` and `security` review should be invoked by the architect after this work
  lands, since this changes authorization logic on an existing endpoint.
