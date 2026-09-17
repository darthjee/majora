# Backend Plan: Refactor: stop logging potential secret in backend/staff/views/_recovery_token_shared.py

Main plan: [plan.md](plan.md)

## Implementation Steps

### Step 1 — Reword the log call to dodge the false-positive heuristic

In `backend/staff/views/_recovery_token_shared.py`, the flagged call is:

```python
logger.info(
    'staff_recovery_token_action action=%s record_id=%s user_id=%s staff_id=%s',
    action, record_id, user_id, staff_user_id,
)
```

`record_id` is always `token.pk` (see the three callers below) — no raw token/secret value is ever passed in. Semgrep's `python-logger-credential-disclosure` rule is almost certainly tripping on the literal word `token` sitting immediately before a `%s`-style placeholder in the message/function name, not on an actual leak.

Reword the format string and/or the local variable name so that pattern disappears while logging the exact same fields. For example, drop the `token` word from the message text itself (the function name can keep it) and/or rename `record_id` in a way that doesn't read as `<word containing token>=%s`, e.g.:

```python
logger.info(
    'staff_recovery_action action=%s recovery_record_id=%s user_id=%s staff_id=%s',
    action, record_id, user_id, staff_user_id,
)
```

The exact rewording is a judgment call — the important constraints are:
- Keep logging exactly the same four non-sensitive fields (action, record id, user id, staff id).
- Do not introduce any raw token/secret value into the log line.
- Do not add a `# nosemgrep` suppression comment — the fix must make the heuristic no longer match, not silence it (see precedent for suppression at `backend/games/views/polls/game_poll_close.py:34`, which this issue deliberately avoids).
- Update the docstring on `log_recovery_token_action` if the wording changes make it stale.

After changing the message, verify (e.g. via `codacy_cli_analyze` on the file, if available) that the `python-logger-credential-disclosure` finding no longer fires.

## Files to Change

- `backend/staff/views/_recovery_token_shared.py` — reword the `logger.info(...)` format string / field name in `log_recovery_token_action` to avoid the false-positive heuristic; no change to what's logged.

## CI Checks

- `backend`: `poetry run pytest --ignore=games/tests/views/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_all`) — covers `backend/staff/tests/staff_user_recovery_token_unexpire_test.py`, `staff_user_recovery_token_delete_test.py`, and `staff_user_recovery_token_force_expire_test.py`, which exercise the three callers of `log_recovery_token_action`.

## Notes

- No callers change (`staff_user_recovery_token_unexpire.py`, `staff_user_recovery_token_delete.py`, `staff_user_recovery_token_force_expire.py` all pass `token.pk`, not the raw token) — this is a message-text-only change.
- If the reworded message still doesn't clear the Codacy/Semgrep finding, escalate back through the issue rather than falling back to a suppression comment, since the issue explicitly scoped this to a rename-based fix.
