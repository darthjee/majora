# Refactor: stop logging potential secret in backend/staff/views/_recovery_token_shared.py

## Context

Codacy's security scan (Semgrep `python-logger-credential-disclosure`, Security, High severity — also open in Codacy's SRM dashboard as an SAST/InsecureStorage finding, priority High, due 2026-11-04) flags a logger call at `backend/staff/views/_recovery_token_shared.py:10` for logging `'staff_recovery_token_action action=%s record_id=%s user_id=%s staff_id=%s'` with a potential hardcoded secret. Recovery-token-related log lines that include enough identifying detail can leak sensitive material into log storage.

## What needs to be done

Backend: review the logger call at `backend/staff/views/_recovery_token_shared.py:10` and remove or redact whatever value is triggering the secret-detection heuristic (e.g. don't log the raw token/secret value itself — log only non-sensitive identifiers), consistent with [Security Guidelines](docs/agents/security-guidelines.md).

## Acceptance criteria

- [ ] The logger call at _recovery_token_shared.py:10 no longer includes secret/token material
- [ ] Existing recovery-token tests still pass
- [ ] Codacy's Semgrep `python-logger-credential-disclosure` finding clears for this file
