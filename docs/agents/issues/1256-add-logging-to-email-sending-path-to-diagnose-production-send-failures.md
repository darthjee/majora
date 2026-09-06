# Add logging to email-sending path to diagnose production send failures

## Context

Majora sends transactional emails (welcome email on registration, password reset
recovery emails) through a single shared helper, `_send_email`, defined in
`backend/accounts/views/auth/_shared.py`. That helper is guarded by
`Settings.emails_enabled()` and calls Django's `send_mail(...)`. The password
reset flow builds on top of it via `send_password_reset_email` /
`_create_and_send_reset_token` in `backend/accounts/views/password_reset/_shared.py`.

None of this code currently emits any log output. There is no `logging.getLogger`
call anywhere in `accounts/views/auth/_shared.py` or
`accounts/views/password_reset/_shared.py`, so when an email fails to send in
production (bad SMTP credentials, connection timeout, disabled emails, template
rendering error, etc.) there is no trace in the logs to diagnose why. The only
related logging in the codebase today is for staff actions on recovery tokens
(`backend/staff/views/_recovery_token_shared.py`), which is unrelated to the
actual send attempt.

This makes production email delivery failures effectively invisible until a user
reports "I never got the email," at which point there is no diagnostic
information (target address, template, SMTP error) to investigate with.

## What needs to be done

Backend (`backend/accounts/`):

- Add a module-level logger (`logging.getLogger(__name__)`) to
  `backend/accounts/views/auth/_shared.py` and
  `backend/accounts/views/password_reset/_shared.py`.
- In `_send_email`, log:
  - An info-level message before attempting to send, including the recipient
    user identifier/email, the template/subject, and whether emails are enabled
    (short-circuit path via `Settings.emails_enabled()` should also be logged at
    debug/info level so a disabled-emails misconfiguration is visible).
  - An error-level message (with `exc_info=True` or the exception message) when
    `send_mail` raises, before re-raising or handling the failure, so SMTP-level
    errors (connection refused, auth failure, timeout) are captured with enough
    context to correlate with a user report.
  - An info-level message confirming a successful send.
- Ensure the password reset path (`_create_and_send_reset_token` /
  `send_password_reset_email`) benefits from the same logging by virtue of
  going through `_send_email`, or add equivalent logging at that layer if it
  wraps/catches exceptions from `_send_email`.
- Avoid logging sensitive content: do not log the password reset token value,
  email body, or template contents — only recipient identifier, template name,
  and success/failure status.
- Confirm the logger output is picked up by the existing Django `LOGGING`
  configuration in `backend/majora_project/settings.py` (add/adjust a logger
  entry if the current config would otherwise silence or drop these records in
  production).

## Acceptance criteria

- [ ] TODO
