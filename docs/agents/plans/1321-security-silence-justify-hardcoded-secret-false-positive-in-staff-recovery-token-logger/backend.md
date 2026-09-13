# Backend Plan: Security: silence/justify hardcoded-secret false positive in staff recovery-token logger

Main plan: [plan.md](plan.md)

## Implementation Steps

### Step 1 — Rename the log field to stop matching the SAST rule
In `backend/staff/views/_recovery_token_shared.py`, rename the `token_pk` parameter of `log_recovery_token_action()` and the `token_id=%s` placeholder in the log format string to wording that does not contain the substring "token" (e.g. `record_id`/`pk`), so the Codacy SAST rule stops pattern-matching on it. Keep the docstring's guarantee that the raw token value is never logged, and update the three call sites that pass the positional argument accordingly. No behavior change — same values are logged, only the parameter/placeholder name changes.

Confirm (already verified during discussion, re-check as part of this step) that all three call sites obtain `token` via `get_object_or_404(PasswordResetToken, pk=token_id, ...)` and pass `token.pk` — never `token.token` (the actual secret) — so the rename doesn't paper over a real leak.

Run the existing test suite for the three affected views to confirm no behavior change (none of them currently assert on log output, so no test changes are expected).

## Files to Change
- `backend/staff/views/_recovery_token_shared.py` — rename `token_pk` param and `token_id=%s` placeholder in `log_recovery_token_action()`.
- `backend/staff/views/staff_user_recovery_token_delete.py` — update the `log_recovery_token_action(...)` call to match the renamed parameter (positional call, so likely no change needed unless a keyword argument is used).
- `backend/staff/views/staff_user_recovery_token_force_expire.py` — same as above.
- `backend/staff/views/staff_user_recovery_token_unexpire.py` — same as above.

## CI Checks
- `backend`: `poetry run pytest --ignore=games/tests/views/` (CI job: `pytest_all`)

## Notes
- Scope is limited to this one function, per the issue — no codebase-wide audit for similarly-worded log statements.
- This is a pure rename, not a Codacy suppression rule — no `.codacy.yml`/dashboard-side ignore is being added.
