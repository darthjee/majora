# Issue: Scoped API tokens: owner and staff token management endpoints

## Description
Part of epic #1592 (Majora client for automations, with fine-grained API tokens). #1602 added the `ApiToken` model and `ApiTokenAuthentication`; #1603 added scope enforcement, which already refuses scoped tokens on every `account/*` and `staff/*` route (`EXCLUDED_ROUTE_PREFIXES`).

This issue adds the backend endpoints that create, list, rename and revoke tokens, as specified in [`docs/agents/specs/client/token-api.md`](../specs/client/token-api.md). That spec is the source of truth for URLs, payloads, error codes and tests. The frontend pages that use these endpoints are #1605 (owner) and #1606 (staff).

**Out of scope:** keeping Bearer requests out of the proxy cache. The spec's *Caching, proxy and Navi* section covers the proxy `BearerSkipCacheMiddleware`, the rule changes and the backend Bearer safety-net middleware. That work moved to #1643. This issue only makes its own endpoints set `X-Skip-Cache: true`.

## Problem
Approved users have no way to create a scoped token, so the client (#1607 onward) and the token UI (#1605, #1606) have nothing to work with. Staff cannot see or revoke a user's tokens the way they can with recovery tokens. Token management is the most sensitive surface in the epic: if a scoped token could reach it, a narrow token could mint a wider one.

## Expected Behavior
- **Owner endpoints** (`backend/accounts/urls/api_tokens.py`, snake_case), for any approved user with a session:
  - `GET account/api_tokens.json`: the caller's tokens, newest first, as a plain array of token items.
  - `GET account/api_tokens/options.json`: the sorted scope catalogue, the caller's reachable games (`{slug, name}`, sorted by name) and `all_games`.
  - `POST account/api_tokens.json`: create (`name`, `scopes`, optional `games`, optional `expires_at`). Returns 201 with the token item plus `token`, the only response that ever carries the secret.
  - `PATCH account/api_tokens/<id>.json`: rename only. Any other field gives 400 `not_editable`.
  - `DELETE account/api_tokens/<id>.json`: revoke (deletes the row), 204.
- **Staff endpoints** (`backend/staff/urls.py`, kebab-case, next to `recovery-tokens`), for staff and superusers:
  - `GET staff/users/<user_id>/api-tokens.json`: the user's tokens (metadata only).
  - `DELETE staff/users/<user_id>/api-tokens/<token_id>.json`: revoke, 204, logged without the secret.
- **Validation:** scopes come from the `accounts.scopes.SCOPES` catalogue; games must be *reachable* (DM, player or PC owner, or every game for superusers). Error codes follow the spec table (`invalid_scope`, `duplicate_scope`, `game_not_reachable`, `duplicate_game`, `expires_in_past`, `not_editable`, …), all reported together in one 400.
- **Lookups** are scoped (`owner=request.user` / `owner_id=user_id`), so tokens outside the scope, and unknown users, give 404.
- **Session only:** a scoped token gets 403 `token_not_allowed` on all 7 method + URL pairs. Session cookies and legacy `Token` keys work.
- Every endpoint sets `X-Skip-Cache: true`, has a single private variant, accepts JSON only (415 otherwise), and stays out of Navi.

## Solution
- **`require_session(request)`** in `backend/games/views/common.py`, next to `require_staff`. It returns 403 `token_not_allowed` when `request.auth` is an `ApiToken`. Every token view calls it first, before `require_staff`, as a second layer on top of the #1603 exclusion.
- **Reachable-games helper** in `backend/accounts/`, used both for create validation and for `options.json`, so the UI and the backend cannot disagree.
- **One shared token-item serializer** for the owner list, the staff list and the rename response (sorted `scopes`, `games` as `{slug, name}`, `status` `active`/`expired`), plus a create serializer that rejects unknown fields with `not_editable`.
- Views use `@restricted` (outermost) and `@parser_classes([JSONParser])`, with one view per URL and several methods. Create goes through `ApiToken.objects.create_token`.
- Staff revocations are logged like `log_recovery_token_action`.
- **Docs, in the same PR:** a new `access-control/api-token.md`, plus updates to `access-control.md`, `user.md`, `principles.md`, `endpoints.md` and `no-private-cache-routes.md`, as listed in the spec. `permissions.yaml` is unchanged.
- **Tests:** the spec's [testing strategy](../specs/client/token-api.md#testing-strategy) for auth, create, rename/revoke, options, lists, staff and edge cases, plus `X-Skip-Cache: true` on every token endpoint. The Bearer-response header tests and the proxy PHPUnit tests are part of #1643.
- **Reviews:** `security` and `data-access`.

## Benefits
Users can create least-privilege tokens for automations, staff keep control over every user's credentials, and the two-layer session-only guard keeps token management out of reach of the tokens themselves.
