# Issue: Add logging to email-sending path to diagnose production send failures

## Description

Add structured logging to Majora's email-sending path (`_send_email` in
`backend/accounts/views/auth/_shared.py`, used by the welcome email, staff
test-email, and password-reset email flows) so production email delivery
attempts and failures are visible in logs instead of being completely silent.

## Problem

None of the email-sending code emits any log output today. When production
SMTP was configured (Dreamhost) and a staff-triggered test email never
arrived, there was no way to tell whether the `EMAILS_ENABLED` flag was
actually true at request time, whether a send was even attempted, or whether
the SMTP request to the host failed. The only existing logging in the
codebase (`backend/staff/views/_recovery_token_shared.py`) covers staff
recovery-token actions, unrelated to the actual send attempt. Django also had
no `LOGGING` configuration at all, so even adding `logger.info(...)` calls
would have been silently dropped rather than surfaced anywhere (e.g. Render's
log viewer).

## Expected Behavior

After this change, every call through `_send_email` produces a log line
showing: the resolved `EMAILS_ENABLED` flag value, whether the send was
skipped (disabled), attempted (with target SMTP host/port and
template/subject), and its outcome (success, or failure with a captured
traceback via `logger.exception`) — all visible in Render's log capture
(stdout), without changing any existing behavior (error propagation,
`fail_silently`, etc. stay exactly as they were). No sensitive content (raw
token, email body, recipient's actual email address) is ever logged —
`user_id` is used instead of `user.email`.

## Solution

- Add a `LOGGING` config to `backend/majora_project/settings.py`: targeted
  `accounts`/`staff` loggers (the only two apps that log anything today)
  writing to stdout via a `StreamHandler`, level controlled by a new
  `DJANGO_LOG_LEVEL` env var (default `INFO`), `propagate: False` to avoid
  double-logging Django's own `django`-namespaced records in local dev.
- Add a module-level `logger = logging.getLogger(__name__)` to
  `backend/accounts/views/auth/_shared.py` and instrument `_send_email` to
  log: the `EMAILS_ENABLED` flag check, a skip when disabled, an attempt
  (with host/port/template/subject) before calling `send_mail`, and
  success/failure afterwards (failure via `logger.exception`, then
  re-raised unchanged).
- `send_password_reset_email` (in
  `backend/accounts/views/password_reset/_shared.py`) needs no separate
  logger — it already funnels through the same instrumented `_send_email`.
- Extend the existing tests in `test_email_test.py`, `register_test.py`, and
  `recover_test.py` with `assertLogs` assertions for the skip/success paths,
  plus a new test asserting a `send_mail` failure is logged and still
  propagates.

This has already been implemented on branch `issue-1256` (commit
`3ff69622`); the full backend test suite (5506 tests) passes and `ruff` is
clean.

## Benefits

- Production email failures (bad SMTP credentials, connection issues, a
  disabled flag) are now diagnosable from Render's log viewer instead of
  being a silent, unreproducible "I never got the email" report.
- Establishes a reusable `LOGGING` pattern (targeted per-app loggers to
  stdout) that any future backend logging can build on, since none existed
  before this.
