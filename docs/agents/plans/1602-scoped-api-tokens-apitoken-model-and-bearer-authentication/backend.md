# Backend Plan: Scoped API tokens: ApiToken model and Bearer authentication

Issue: [1602-scoped-api-tokens-apitoken-model-and-bearer-authentication.md](../../issues/1602-scoped-api-tokens-apitoken-model-and-bearer-authentication.md)

## Overview

Implement the token foundation described in
[`specs/client/tokens.md`](../../specs/client/tokens.md): the `ApiToken` model and migration,
token generation, the Bearer authentication class (first in `DEFAULT_AUTHENTICATION_CLASSES`),
an interim fail-closed 403 for authenticated tokens, and auto-revoke in the staff deny view.

## Context

- Today only DRF's `Token` exists, read by `CookieTokenAuthentication`
  (`backend/accounts/authentication.py`), which swallows stale headers and filters unapproved users.
- The spec fixes every detail: format `^mjr_([A-Za-z0-9]{8})_([A-Za-z0-9]{43})$`, unsalted SHA-256
  of the secret part, lookup by unique prefix plus `hmac.compare_digest`, one generic 401
  `token_invalid` for every failure, `WWW-Authenticate: Bearer realm="api", error="invalid_token"`.
- Decided during refinement: until #1603 adds the per-view scope check, every authenticated Bearer
  request is refused with **403** `token_not_allowed`. The scope catalogue constant and creation-time
  validation are out of scope, and `ApiToken` is not registered in the Django admin.

## Steps

- [01 — ApiToken model and migration](backend/01-apitoken-model.md)
- [02 — Token generation](backend/02-token-generation.md)
- [03 — ApiTokenAuthentication and settings](backend/03-bearer-authentication.md)
- [04 — Auto-revoke in the staff deny view](backend/04-auto-revoke.md)
- [05 — Record the interim fail-closed in the spec](backend/05-spec-update.md)

## CI Checks

- `backend`: `docker-compose run --rm majora_tests pytest` (CI jobs: `pytest_all`,
  `pytest_views_rest`, `pytest_views_characters`)
- `backend`: `docker-compose run --rm majora_tests ruff check .` and complexity report
  `bin/reports.sh ci` (CI job: `checks`)
- `docs`: markdownlint (CI job: `markdownlint`) for the spec edit

## Notes

- The new migration depends on the latest `accounts` migration
  (`0009_passwordresettoken_expires_at_invalidated_at`) and on `games` for the `games` M2M; check
  that no `games` migration depends back on `accounts` in a way that creates a cycle.
- Putting the Bearer class first changes `WWW-Authenticate` on every 401 to `Bearer realm="api"`.
  The spec says this is intended; existing tests that assert the old `Token` header (if any) must
  be updated, not the behaviour.
- Do not add a `post_save` signal or `UserProfile.save()` override (rejected in the spec).
- The interim 403 must sit exactly where #1603 will put the scope check, so #1603 just replaces it.
