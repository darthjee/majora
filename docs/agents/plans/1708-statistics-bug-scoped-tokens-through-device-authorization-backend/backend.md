# Backend Plan: Statistics bug: scoped tokens through device authorization (backend)

Main plan: [plan.md](plan.md)

## Overview

The device-authorization flow (`backend/accounts/views/authorization_requests/`) issues a
legacy DRF `Token` plus a browser session with full staff powers. `analyse.py` (Epic #1696)
needs a read-only `statistics:read` token from that flow, so a request can now carry scopes and
yields a scoped `mjr_` `ApiToken` with exactly those scopes. The contract is
`docs/agents/specs/statistics-bug/export-endpoint.md#device-authorization`.

## Context

- The scope catalogue is `backend/accounts/scopes.py` (`SCOPES`, `STAFF_ONLY_SCOPES`).
- `ApiTokenCreateSerializer` (`backend/accounts/serializers/api_token/create.py`) already
  has the validation codes to reuse: `invalid_scope`, `duplicate_scope`, `scope_staff_only`,
  the `error()` and `has_duplicates()` helpers, and the bound `max_length=len(SCOPES)`.
- `may_hold_staff_scopes(user)` (`backend/accounts/api_tokens.py`) is the staff check.
- `ApiToken.objects.create_token(owner, name, scopes, games=None, expires_at=None)` returns
  `(token, plain_token)` and stores only the hash.
- The #1700 approval screen already reads `scopes` from each list item.

## Steps

- [01 — Store and validate requested scopes](backend/01-store-and-validate-scopes.md)
- [02 — Expose scopes and check them on approval](backend/02-list-and-approval.md)
- [03 — Issue a scoped token on poll](backend/03-poll-scoped-token.md)
- [04 — Update the docs](backend/04-docs.md)

## CI Checks

- `backend`: the backend test suite and linters through `docker-compose` / `make tests`
  (never host Python), as described in `AGENTS.md`.

## Notes

- **Token name length:** the issue says "truncated to 255 characters", but the rename and
  create serializers cap names at `NAME_MAX_LENGTH` (100). Truncate the generated name to
  `NAME_MAX_LENGTH` so the token stays renamable/valid under the same rules.
- **History model:** `AuthorizationRequest` has `EnumSafeHistoricalRecords`
  (`app='versioning'`); adding the field needs the matching `versioning` migration as well.
  Generate both with `makemigrations` through docker-compose.
- **Security / data-access review:** create is unauthenticated, so validation is the only
  guard; the raw token is returned once and never stored or logged; no session or statistics
  session is attached for a scoped poll.
- A staff approver later demoted still gets `403 not_allowed` on the export (it re-checks staff
  per request), so no extra check is needed at poll time.
