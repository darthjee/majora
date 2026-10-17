# Issue: Scoped API tokens: scope enforcement across views

## Description
Part of epic #1592 (Majora client for automations, with fine-grained API tokens). #1602 added the `ApiToken` model (with `scopes` and `games`) and `ApiTokenAuthentication`, whose `_check_scopes` currently refuses every scoped token with 403 `token_not_allowed` as an interim fail-closed. This issue replaces that placeholder with real per-view scope enforcement, as specified in [`docs/agents/specs/client/scopes.md`](../specs/client/scopes.md).

About 178 API views need a declaration, so the work is split. **This issue delivers the enforcement core.** Each group of resource families gets its `@token_scopes` declarations in its own sub-issue, and upload finalize gets one too.

**Hard blocker:** #1616 (plain routes must never serve hidden content to editors) must be merged before work on this issue or any of its sub-issues starts, because the "public reads need no scope" rule depends on it.

## Problem
Scoped API tokens can authenticate but cannot reach any endpoint, so the client (#1607 onward) has nothing it can call. Enforcement has to be added without ever letting a token widen its owner's access, and without changing session or legacy-token behaviour.

## Expected Behavior
Once this issue and all its sub-issues are done:

- A request with a scoped token succeeds only if the owner's existing role rules allow it **and** the token carries every scope the endpoint declares for that HTTP method. A token never widens access.
- `GET` maps to `read`; `POST`/`PUT`/`PATCH`/`DELETE` map to `write`. The catalogue is the 32 scopes `<family>:read|write` over the 16 families in the spec.
- Public (`AllowAny`) reads need no scope; restricted reads need `read` on every family in the response; writes need `write` on the owning family plus `read` on any other family whose restricted data they touch.
- When the token has a game list, game-scoped requests whose `game_slug` is not on it get 403 `game_not_allowed`.
- Fail closed: a view with no `@token_scopes` declaration, or no entry for the method, rejects scoped tokens with 403 `token_not_allowed`.
- Token management, `account/*`, `users/*`, `staff/*` and Django admin always give 403 `token_not_allowed`. Views with `@authentication_classes([])` are unchanged.
- A missing scope gives 403 `scope_missing`, with the existing `{"errors": {"detail": ["<code>"]}}` body. No 404 masking.
- Session and legacy-token requests behave exactly as before.

## Solution
### This issue (core)
- **Scope catalogue:** a single constant in `backend/accounts/`, owned here. #1604 reuses it for token-creation validation and `options.json`.
- **Decorator:** `@token_scopes(GET=[...], POST=[...], ...)` in `backend/games/decorators.py`, next to `@regular`/`@restricted`.
- **Check:** replace `ApiTokenAuthentication._check_scopes`. It reads the declaration from `request.resolver_match.func`, checks the scopes (stored scopes no longer in the catalogue grant nothing) and the `game_slug` kwarg, and raises 403 `scope_missing` / `game_not_allowed` / `token_not_allowed`. It does no object lookups.
- **Exclusions:** token management, account, users, staff and admin views are on an explicit exclusion list and always give `token_not_allowed`.
- **Coverage test:** walk every URL pattern and assert that each DRF view declares `@token_scopes` for every method it serves or is on the exclusion list. Until every sub-issue lands, the test also uses a **temporary pending list** of undeclared views. Each sub-issue removes its own views from that list, and the last one deletes the list.
- **Tests:** the decorator and auth-class check (missing scope, wrong game, no declaration, missing method entry, unknown stored scope, owner-role intersection) on a few representative views, the excluded families, and unchanged session and legacy-token behaviour.
- **Reviews:** `security` and `data-access`.

### Sub-issues (one per group)
1. #1630 — `games`, `players`, `conversations`, including filtering `my-games.json` by the token's games
2. #1631 — `pcs`, with nested routes and photos
3. #1632 — `npcs`, with nested routes and photos
4. #1633 — `documents`
5. #1634 — `factions`, `tasks`
6. #1635 — `items`, `common_items`, `possessions`, `recipes`
7. #1636 — `treasures`, game copies and the top-level routes
8. #1637 — `sessions`, `polls`
9. #1638 — `miniatures`
10. #1639 — Upload finalize: `PATCH uploads/<type>/<id>.json` resolves its family and game from `content_object` through the fixed model-to-family map, and rejects staff and copy-origin uploads

Each sub-issue declares scopes following the spec's family table and its read/write/link rules, removes its views from the pending list, and adds per-family tests: missing scope, wrong game, a public read without scopes, restricted multi-family reads, link writes, and the owner-role intersection.

## Benefits
Scoped tokens become usable, so the client and automations can call the API with least privilege. Fail-closed defaults and the coverage test mean a new endpoint can never be silently opened to tokens, and splitting the declarations keeps each PR reviewable.
