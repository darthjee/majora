# Plan: Refactor: stop logging potential secret in backend/staff/views/_recovery_token_shared.py

Issue: [1356-refactor-stop-logging-potential-secret-in-backend-staff-views-recovery-token-shared-py.md](../../issues/1356-refactor-stop-logging-potential-secret-in-backend-staff-views-recovery-token-shared-py.md)

## Overview

Reword the log message in `log_recovery_token_action` (`backend/staff/views/_recovery_token_shared.py`) so it no longer matches Semgrep's `python-logger-credential-disclosure` heuristic, without changing what data is actually logged (action, token record id, user id, staff id) or adding a suppression comment.

See [backend.md](backend.md) for the full plan.
