# Instrument `_send_email`

All three current email features (test email, welcome email, password reset
email) funnel through the single `_send_email` helper in
`backend/accounts/views/auth/_shared.py`, so instrumenting that one choke
point covers all of them — no changes needed in
`backend/accounts/views/password_reset/_shared.py`.

Add a module-level `logger = logging.getLogger(__name__)` (follows the only
existing precedent in the codebase, `backend/staff/views/_recovery_token_shared.py`:
`%s`-style `key=value` messages, logging `user.id` rather than the user's raw
email address). Log, in order:

- The resolved `EMAILS_ENABLED` flag value, on every call.
- A skip message when the flag is off (return immediately after).
- An attempt message before calling `send_mail`, including the template,
  subject, and target SMTP host/port (`settings.EMAIL_HOST`/`EMAIL_PORT`).
- Success after `send_mail` returns without error.
- Failure via `logger.exception(...)` (captures the traceback) if `send_mail`
  raises, then re-raise the original exception unchanged — no `fail_silently`,
  no behavior change to the three unguarded callers
  (`accounts/views/auth/email.py::test_email`,
  `accounts/views/auth/register.py::register`,
  `accounts/views/password_reset/recover.py::recover`), only added
  observability.

Never log the raw reset token, email body, or template contents.

## Files to Change

- `backend/accounts/views/auth/_shared.py` — add `import logging`, the
  module-level `logger`, and rewrite `_send_email` to log at each stage
  described above.
