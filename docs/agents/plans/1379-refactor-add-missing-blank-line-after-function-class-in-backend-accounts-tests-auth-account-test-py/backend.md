# Backend Plan: Refactor: add missing blank line after function/class in backend/accounts/tests/auth/account_test.py

Main plan: [plan.md](plan.md)

## Overview
Codacy's Prospector flags `E305` (expected 2 blank lines after class or function definition, found 1) at `backend/accounts/tests/auth/account_test.py:21`. The whitespace-only fix has no behavior change.

## Context
The top-level function `_avatar_url_for` ends on line 19. Line 20 is blank, and line 21 is `TEST_PASSWORD = get_random_string(20)`, so only one blank line separates them.

## Implementation Steps

### Step 1 — Insert the missing blank line
In `backend/accounts/tests/auth/account_test.py`, add one blank line between the end of `_avatar_url_for` and `TEST_PASSWORD = get_random_string(20)` so that two blank lines follow the function. Do not touch anything else (the `ACCOUNT_URL` constant and class spacing are already correct).

## Files to Change
- `backend/accounts/tests/auth/account_test.py` — add one blank line before `TEST_PASSWORD` (line 21).

## CI Checks
- `backend`: `cd backend && poetry run ruff check .` (CI job: `checks`; ruff selects `E`, `F`, `W`, `I`, `D211`, `D106`, so it also covers E305)
- `backend`: `pytest accounts/tests/auth/account_test.py` (or the project's usual test command, CI job: `pytest_all`) — confirms the test file still passes

## Notes
- Whitespace-only change; no behavior impact.
- Codacy's Prospector finding can only be confirmed as cleared after the PR is analysed on Codacy.
