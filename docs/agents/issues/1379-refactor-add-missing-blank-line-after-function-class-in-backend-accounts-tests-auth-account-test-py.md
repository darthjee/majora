# Refactor: add missing blank line after function/class in backend/accounts/tests/auth/account_test.py

## Context

Codacy's Prospector scan (`pycodestyle E305`, CodeStyle, Info severity) flags `backend/accounts/tests/auth/account_test.py:21` for expecting 2 blank lines after a class or function definition but finding only 1, per PEP 8 spacing conventions that ruff/pycodestyle both enforce.

## What needs to be done

Backend: add the missing blank line after the class/function definition preceding line 21 in `backend/accounts/tests/auth/account_test.py`.

## Acceptance criteria

- [ ] There are 2 blank lines after the relevant class/function definition in account_test.py
- [ ] Codacy's Prospector `pycodestyle E305` finding clears for this file
- [ ] The test file still passes ruff/pytest
