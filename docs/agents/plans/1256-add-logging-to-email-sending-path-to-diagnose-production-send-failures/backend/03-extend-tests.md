# Extend tests with log assertions

Use Django's `self.assertLogs('accounts.views.auth._shared', level='INFO')`
as a context manager around the existing success/skip test cases to assert
the new log lines are emitted, plus one new test for the failure path (mock
`send_mail` to raise, assert the exception still propagates and a failure log
was emitted).

## Files to Change

- `backend/accounts/tests/auth/test_email_test.py` — wrap
  `test_sends_email_for_user_with_email` and
  `test_does_not_send_email_when_emails_disabled` in `assertLogs`; add a new
  `test_logs_and_reraises_when_send_fails` (monkeypatches
  `accounts.views.auth._shared.send_mail` to raise, asserts the raised
  exception and the `email_send_failed` log line).
- `backend/accounts/tests/auth/register_test.py` — wrap
  `test_sends_welcome_email_when_emails_enabled` and
  `test_does_not_send_welcome_email_when_emails_disabled` in `assertLogs`.
- `backend/accounts/tests/password_reset/recover_test.py` — wrap
  `test_sends_email_and_creates_token_for_matching_email` and
  `test_does_not_send_email_when_emails_disabled` in `assertLogs`.
