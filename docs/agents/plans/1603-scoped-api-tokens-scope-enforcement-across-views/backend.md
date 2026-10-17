# Backend Plan: Scoped API tokens: scope enforcement across views

Main plan: [plan.md](plan.md)

## Overview
Replace the interim fail-closed `ApiTokenAuthentication._check_scopes` (added by #1602) with the
per-view scope and game check described in
[`docs/agents/specs/client/scopes.md`](../../specs/client/scopes.md). This issue delivers only the
core. Every view stays undeclared, which means fail-closed, until its family's sub-issue
(#1630–#1639) adds `@token_scopes`.

## Context
- **Blocked by #1616.** Do not start until it is merged.
- `ApiToken` already has `scopes` (a `JSONField` list) and `games` (an M2M to `Game`), see
  `backend/accounts/models/api_token.py`.
- `REST_FRAMEWORK.DEFAULT_AUTHENTICATION_CLASSES` lists `ApiTokenAuthentication` first, then
  `CookieTokenAuthentication`. Views with `@authentication_classes([])` never run it.
- There is no custom DRF exception handler, so `PermissionDenied` renders as `{"detail": ...}`. The
  spec requires `{"errors": {"detail": ["<code>"]}}` for the scope 403s (step 03).
- Many views come from factories (e.g. `build_item_acquire_view(npc=True)` in
  `games/views/game/_character/…`). The decorator must work on factory-built views, and the
  sub-issues will declare scopes inside those factories.

## Steps

- [01 — Scope catalogue constant](backend/01-scope-catalogue.md)
- [02 — `@token_scopes` decorator](backend/02-token-scopes-decorator.md)
- [03 — Enforce scopes and games in `ApiTokenAuthentication`](backend/03-enforce-in-authentication.md)
- [04 — Exclusions and URL coverage test](backend/04-exclusions-and-coverage-test.md)

## CI Checks
- `backend/`: `docker-compose run --rm majora_tests pytest` and `ruff check .` (CI jobs:
  `pytest_views_characters`, `pytest_views_rest`, `pytest_all`, `checks`)

## Notes
- Needs `security` and `data-access` reviews.
- The token-creation validation (unknown or duplicate scopes give 400, games must be reachable by
  the owner) belongs to #1604. That issue imports the catalogue from step 01.
- `my-games.json` filtering and upload finalize are handled by #1630 and #1639, not here.
- Session and legacy (`Authorization: Token`) requests must not change. `ApiTokenAuthentication`
  returns `None` for them before any scope logic runs. Keep the existing tests for this green.
