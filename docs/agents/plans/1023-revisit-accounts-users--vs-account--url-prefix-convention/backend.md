# Backend Plan: Revisit accounts users/ vs account/ url prefix convention

Main plan: [plan.md](plan.md)

## Shared contracts

This agent produces the three renamed routes (path + `name=`) that frontend's
literal path strings must match:

| Method | Old path | New path | Old name | New name |
|---|---|---|---|---|
| POST | `/users/test-email.json` | `/staff/test-email.json` | `users-test-email` | `staff-test-email` |
| POST | `/users/language.json` | `/account/language.json` | `users-language` | `account-language` |
| GET/PATCH | `/users/account.json` | `/account/account.json` | `users-account` | `account-account` |

No view code, permission classes, serializers, or response shapes change —
this is a pure routing rename. `authorization_requests.py` is untouched;
its existing split already matches the adopted convention.

## Implementation Steps

### Step 1 — Rename the three routes

In `backend/accounts/urls/auth.py`, update the three `path(...)` entries per
the table above (path string and `name=` only — `views.test_email`,
`views.language`, `views.account` stay as the view functions). Leave
`users/login.json`, `users/logout.json`, `users/register.json`,
`users/status.json` unchanged (they stay `users/*` — pre-login or session
actions per the adopted convention).

### Step 2 — Update backend tests referencing the old paths/names

- `backend/accounts/tests/auth/test_email_test.py` — replace all 5
  occurrences of `/users/test-email.json` with `/staff/test-email.json`
  (update any docstrings mentioning the old path too).
- `backend/accounts/tests/auth/language_test.py` — replace all 3
  occurrences of `/users/language.json` with `/account/language.json`
  (leave the unrelated `/users/status.json` reference on line 45 alone).
- `backend/accounts/tests/auth/account_test.py` — update the `ACCOUNT_URL`
  constant (currently `/users/account.json`) to `/account/account.json`,
  update docstrings mentioning `/users/account.json`, and change
  `reverse('users-account')` to `reverse('account-account')`.

Run the full accounts test suite locally to confirm nothing else references
the old paths/names:

```bash
docker-compose run --rm majora_tests pytest accounts -k "test_email or language or account"
```

### Step 3 — Update backend documentation

- `docs/agents/access-control/endpoints.md` — update the three table rows
  currently reading `/users/test-email.json`, `/users/language.json`,
  `/users/account.json` to their new paths (leave the access-control notes
  in each row's remaining columns unchanged, only the path itself moves).
- `docs/agents/access-control/principles.md` — rewrite the "Known gap" note
  under "Account resources" (currently: *"today's endpoints aren't fully
  unified under `/account/...` yet (some, e.g. `/users/account.json`, still
  live under `/users/...`) — that layout gap is tracked here, not fixed by
  reshuffling routes."*) to reflect that the gap is now closed: `/account.json`
  and `/language.json` live under `/account/...`, and record the adopted
  convention (pre-login/session-lifecycle → `users/*`; own-account-data →
  `account/*`; staff-only → `staff/*`) so future contributors have a rule to
  follow instead of rediscovering this from scratch.
- `docs/agents/no-private-cache-routes.md` — update the `GET /users/account.json`
  row to `GET /account/account.json`.
- `docs/agents/product/entities/ownership-and-roles.md` — update the
  `POST /users/test-email.json` reference (around the `require_staff` note)
  to `POST /staff/test-email.json`.

## Files to Change

- `backend/accounts/urls/auth.py` — rename 3 route paths + `name=` values
- `backend/accounts/tests/auth/test_email_test.py` — update path references
- `backend/accounts/tests/auth/language_test.py` — update path references
- `backend/accounts/tests/auth/account_test.py` — update path constant, docstrings, and `reverse()` name
- `docs/agents/access-control/endpoints.md` — update 3 endpoint path entries
- `docs/agents/access-control/principles.md` — resolve the "Known gap" note, document the adopted convention
- `docs/agents/no-private-cache-routes.md` — update 1 path reference
- `docs/agents/product/entities/ownership-and-roles.md` — update 1 path reference

## CI Checks

- `backend`: `docker-compose run --rm majora_tests pytest` (CI job: `pytest_all`)
- `backend`: `docker-compose run --rm majora_tests ruff check .` (CI job: `checks`)

## Notes

- Double-check no other backend code (redirects, management commands,
  fixtures) hardcodes any of the three old paths beyond what's listed above —
  a repo-wide grep for `users/test-email.json`, `users/language.json`, and
  `users/account.json` turned up only the files listed here as of this plan.
- `users/authorization_requests.json` / `users/authorization_requests/<uuid>.json`
  (create/poll, pre-login) and `account/authorization_requests.json` /
  `.../deny.json` / `.../authorize.json` (already `account/*`) are explicitly
  **not** part of this change — they already match the adopted convention.
