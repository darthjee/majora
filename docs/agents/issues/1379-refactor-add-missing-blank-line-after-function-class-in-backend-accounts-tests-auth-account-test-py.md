# Issue: Refactor: add missing blank line after function/class in backend/accounts/tests/auth/account_test.py

## Description
Codacy's Prospector scan (`pycodestyle E305`, CodeStyle, Info severity) flags `backend/accounts/tests/auth/account_test.py:21`. PEP 8 (enforced by both ruff and pycodestyle) expects 2 blank lines after a top-level function or class definition, but the file has only 1.

## Problem
In `backend/accounts/tests/auth/account_test.py`, the top-level function `_avatar_url_for` (lines 16-19) is followed by a single blank line (line 20) before the module-level constant `TEST_PASSWORD = get_random_string(20)` on line 21. This triggers `E305: expected 2 blank lines after class or function definition, found 1`.

## Expected Behavior
There are 2 blank lines between the end of `_avatar_url_for` and `TEST_PASSWORD`, so the Codacy/Prospector `pycodestyle E305` finding clears for this file.

## Solution
Backend: insert one extra blank line after the `_avatar_url_for` function (before `TEST_PASSWORD = get_random_string(20)`) in `backend/accounts/tests/auth/account_test.py`. Whitespace-only change; no behavior change.

Acceptance criteria:
- [ ] There are 2 blank lines after the `_avatar_url_for` function in account_test.py
- [ ] Codacy's Prospector `pycodestyle E305` finding clears for this file
- [ ] The test file still passes ruff/pytest

## Benefits
Clears a Codacy code-style finding and keeps the file consistent with PEP 8 spacing conventions.
