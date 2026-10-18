# Backend Plan: Scoped API tokens: owner and staff token management endpoints

Main plan: [plan.md](plan.md)

## Overview

Every URL, payload, error code and test case is already settled in [`token-api.md`](../../specs/client/token-api.md). It is the source of truth. This plan maps it onto the existing code. Scoped tokens are already refused on `account/*` and `staff/*` by `EXCLUDED_ROUTE_PREFIXES` in `backend/accounts/authentication.py` (#1603). This issue adds the second layer, `require_session`.

## Context

- Recovery-token precedent: `backend/staff/views/staff_user_recovery_tokens.py`, `staff_user_recovery_token_delete.py`, `_recovery_token_shared.log_recovery_token_action`, `StaffRecoveryTokenSerializer`. Views stack `@restricted` (outermost, sets `X-Skip-Cache: true`), `@api_view` and `@permission_classes([AllowAny])`, and check access inline.
- `ApiToken.objects.create_token(owner, name, scopes, games, expires_at)` already exists and returns `(api_token, plain_token)`, retrying on prefix clashes and raising `IntegrityError` after 3 attempts.
- `accounts.scopes.SCOPES` is the catalogue constant.
- `staff_user_deny` already deletes the user's tokens. `ApiToken` has no `HistoricalRecords` and is not registered in the admin.
- "Reachable": a PC owner is always a `Player` of the PC's game (`pc.player.user`), so reachable games are `Game.objects.filter(players__user=user).distinct()`, or every game for a superuser. Plain staff get no extra games.

## Steps

- [01 — Add require_session and the reachable-games helper](backend/01-session-guard-and-reachable-games.md)
- [02 — Add the token serializers](backend/02-serializers.md)
- [03 — Add the owner endpoints](backend/03-owner-endpoints.md)
- [04 — Add the staff endpoints](backend/04-staff-endpoints.md)
- [05 — Document the endpoints in access control](backend/05-access-control-docs.md)

## CI Checks

- `backend`: `poetry run ruff check .` (CI job: `checks`)
- `backend`: `poetry run pytest --ignore=games/tests/views/` (CI job: `pytest_all`), run through `docker-compose` (`make tests`)
- docs: `yarn lint_md` (CI job: `markdownlint`)

## Notes

- The token routes fall under `account/` and `staff/`, so the #1603 coverage test already treats them as excluded. No pending-list change is needed.
- Out of scope (#1643): `BearerSkipCacheMiddleware`, the proxy rule changes, and the backend Bearer safety-net middleware with its tests.
- Run the `security` and `data-access` reviews on the finished diff.
