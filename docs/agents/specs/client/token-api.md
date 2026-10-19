# Token API

The backend endpoints that manage scoped tokens, and how the proxy and the cache treat requests
that carry one. Part of the [client spec](../client.md) (epic #1592). Refined by #1596 and
implemented by #1604. Amended by #1597 (the [reachable game](#reachable-game) definition and the
`options.json` endpoint the [Token UI](token-ui.md) needs).

## Overview

Two sets of endpoints manage [tokens](tokens.md):

- **owner endpoints**, where an approved user creates, lists, renames and revokes their own
  tokens;
- **staff endpoints**, where staff and superusers list and revoke any user's tokens.

Both are session-only: a scoped token can never call them (see [Scopes](scopes.md) and
[Session-only enforcement](#session-only-enforcement)). They are consumed by the
[Token UI](token-ui.md).

This page also settles how the Tent proxy and the backend keep every request that carries
`Authorization: Bearer` out of the proxy cache, on every route (see
[Caching, proxy and Navi](#caching-proxy-and-navi)).

## Decisions

### Endpoints

#### Owner endpoints

They live in a new `backend/accounts/urls/api_tokens.py` and use snake_case, like
`account/authorization_requests.json`.

| Method | URL | Action |
|---|---|---|
| GET | `account/api_tokens.json` | List the caller's tokens (metadata only). |
| GET | `account/api_tokens/options.json` | Scope catalogue and reachable games for the create form. |
| POST | `account/api_tokens.json` | Create a token. The response carries the full token, once. |
| PATCH | `account/api_tokens/<int:token_id>.json` | Rename (name only). |
| DELETE | `account/api_tokens/<int:token_id>.json` | Revoke (deletes the row). |

- Any approved user can use them. They count as an `own_account` resource (see
  [`permissions.yaml`](../../permissions.yaml)).

#### Staff endpoints

They go in `backend/staff/urls.py`, next to the recovery-token routes, and use kebab-case, like
`recovery-tokens`.

| Method | URL | Action |
|---|---|---|
| GET | `staff/users/<int:user_id>/api-tokens.json` | List the user's tokens (metadata only). |
| DELETE | `staff/users/<int:user_id>/api-tokens/<int:token_id>.json` | Revoke (deletes the row). |

- Staff and superusers can list and revoke any user's tokens, the same way recovery tokens work
  today (see [`access-control/user.md`](../../access-control/user.md)).

#### Shape

- **One view per URL, with several methods** (`['GET', 'POST']` and `['PATCH', 'DELETE']`),
  following the existing pattern.
- **The id in the URL is the integer pk**, matching `recovery-tokens`.
- **Scoped lookups, 404 outside the scope.** Owner views look tokens up with
  `owner=request.user`. The staff views look them up with `owner_id=user_id`, so a token id that
  does not belong to the user in the URL gives 404, as `staff_user_recovery_token_delete` does.
  An unknown `user_id` also gives 404. Enumerating pks therefore reveals nothing.
- **No single-token GET.** The token UI only needs the list.
- **No proxy rule conflicts.** `delete.php` only catches photo DELETEs, so every token route
  falls to `rules/backend.php`.
- Rejected: **the token prefix as the URL id.** Users recognise the prefix, but these endpoints
  are session-only and driven by the UI, so it buys little and breaks the `recovery-tokens`
  precedent.

### Payloads

#### Token item

One shared serializer is used by the owner list, the staff list and the rename response:

```json
{
  "id": 42,
  "name": "NPC generator",
  "prefix": "a1B2c3D4",
  "scopes": ["documents:read", "npcs:write"],
  "games": [{"slug": "curse-of-strahd", "name": "Curse of Strahd"}],
  "expires_at": "2026-12-31T23:59:59Z",
  "last_used_at": null,
  "created_at": "2026-10-16T12:00:00Z",
  "status": "active"
}
```

- `scopes` is sorted.
- `games` is a list of `{slug, name}`, so the UI needs no second lookup. `[]` means every game
  the owner can reach (see [Reachable game](#reachable-game)).
- `expires_at` is `null` when the token never expires.
- `status` is `active` or `expired`. It is a convenience field the UI may recompute, like
  `StaffRecoveryTokenSerializer.status`.
- The secret and its hash never appear. The UI shows the token as `mjr_<prefix>…`.

#### Create: `POST account/api_tokens.json`

```json
{
  "name": "NPC generator",
  "scopes": ["npcs:write", "documents:read"],
  "games": ["curse-of-strahd"],
  "expires_at": "2026-12-31T23:59:59Z"
}
```

- `name`: required. Trimmed, not blank, at most 100 characters.
- `scopes`: required and not empty. Every scope must come from the catalogue in
  [Scopes](scopes.md). Duplicates give 400.
- `games`: optional list of slugs, defaulting to `[]`. Every slug must be a
  [reachable game](#reachable-game). Duplicates give 400.
- `expires_at`: optional ISO 8601 datetime in the future, or `null` for never. The token UI
  turns its presets (30 or 90 days) and a custom date into this single form. **A missing
  `expires_at` means never**, the same as `null`.
- **`owner` is always `request.user`.** Any field other than `name`, `scopes`, `games` and
  `expires_at` (for example `owner`, `prefix`, `id`, `last_used_at`) gives 400 `not_editable`.
- **JSON bodies only** (see [CSRF](#csrf)).
- Returns **201** with the token item plus `"token": "mjr_<prefix>_<secret>"`. This is the only
  response that ever carries the full token.

#### Rename: `PATCH account/api_tokens/<id>.json`

- Body `{"name": "..."}`, with the same rules as on create. Returns **200** with the updated
  token item.
- Any other field (`scopes`, `games`, `expires_at`, …) gives 400 `not_editable`, so a client
  never believes it changed something that cannot be edited. DRF's default of ignoring unknown
  fields is not used.

#### Revoke

- `DELETE account/api_tokens/<id>.json` and
  `DELETE staff/users/<user_id>/api-tokens/<token_id>.json` return **204** with no body.

#### Options: `GET account/api_tokens/options.json`

```json
{
  "scopes": ["common_items:read", "common_items:write", "conversations:read", "…"],
  "games": [{"slug": "curse-of-strahd", "name": "Curse of Strahd"}],
  "all_games": false
}
```

- `scopes` is the catalogue constant from [Scopes](scopes.md), sorted. It is how the catalogue
  reaches the UI, so the frontend keeps no copy of it.
- `games` is the [reachable game](#reachable-game) helper's output, as `{slug, name}`, sorted by
  name.
- `all_games` is `true` when the reachable set is every game (superusers). The token UI uses it
  for its superuser warning.
- It follows the same rules as the other owner endpoints: session-only (401 without a session,
  403 `token_not_allowed` for a scoped token), a single private variant, `X-Skip-Cache: true`,
  and no Navi entry.
- Rejected: **`my-games.json`** (membership only, so superusers miss games, and its definition
  could drift from validation), **`games.json`** (public and domain-scoped) and **a JS copy of
  the catalogue** (drifts from the backend constant).

#### Lists

- `GET account/api_tokens.json` and `GET staff/users/<user_id>/api-tokens.json` return a plain
  JSON array of token items, newest first (`-created_at`), with no pagination, like the
  recovery-token list.

### Validation and error codes

Errors use the project's existing shape, `{"errors": {"<field>": ["<code>"]}}`, produced by
`validated_or_error` and `_error_codes` (`backend/games/views/common.py`). The codes defined in
[Tokens](tokens.md) and [Scopes](scopes.md) are kept as they are.

#### 400 on create or rename

All field errors are reported together in one response.

| Field | Case | Code |
|---|---|---|
| `name` | missing / blank / over 100 characters | `required` / `blank` / `max_length` (DRF defaults) |
| `scopes` | missing / empty list | `required` / `empty` |
| `scopes` | entry not in the catalogue | `invalid_scope` |
| `scopes` | the same entry twice | `duplicate_scope` |
| `scopes` | more entries than the catalogue holds / an entry over 64 characters | `max_length` (the entry error is keyed by its position) |
| `games` | unknown slug, or a game the owner cannot reach | `game_not_reachable` (one code for both, so slugs cannot be probed) |
| `games` | the same slug twice | `duplicate_game` |
| `games` | more than 100 slugs / a slug longer than `Game.game_slug` allows | `max_length` (the entry error is keyed by its position) |
| `expires_at` | not a datetime / not in the future | `invalid` / `expires_in_past` |
| any field other than `name`, on PATCH | `scopes`, `games`, `expires_at`, … | `not_editable`, keyed by the field |
| any field outside `name`, `scopes`, `games`, `expires_at`, on create | `owner`, `prefix`, `id`, … | `not_editable`, keyed by the field |

For example: `{"errors": {"scopes": ["not_editable"]}}`. An entry error is keyed by
its position in the list, for example `{"errors": {"scopes": {"1": ["max_length"]}}}`.

#### Access

| Case | Status | Body |
|---|---|---|
| No session (anonymous, or an unapproved user) | 401 | The existing `unauthenticated_response`. |
| Request authenticated by a scoped token, whatever its scopes | 403 | `{"errors": {"detail": ["token_not_allowed"]}}` (from [Scopes](scopes.md)). |
| Non-staff session on a staff endpoint | 403 | `{"errors": {"detail": ["not_allowed"]}}` (from `require_staff`). |
| Invalid Bearer token | 401 | `token_invalid` (from [Tokens](tokens.md)). |
| Token id not owned by the caller (owner) or by `user_id` (staff), or unknown `user_id` | 404 | DRF's default via `get_object_or_404`, like the recovery-token endpoints. |

#### Other

- A form-encoded body gives **415** (DRF's default body).
- If all 3 prefix retries fail (see [Tokens](tokens.md#token-format)), the request fails with a
  500. With about 2×10¹⁴ possible prefixes this does not happen in practice, so it gets no
  dedicated code.

### Session-only enforcement

- **What "session" means.** A request authenticated by `CookieTokenAuthentication`: the browser
  cookie **and** the legacy `Authorization: Token <key>` that the SPA itself sends
  (`frontend/assets/js/client/BaseClient.js`). Only a request whose `request.auth` is an
  `ApiToken` is refused. A legacy DRF `Token` (for example the crawler's) can therefore manage
  scoped tokens; this is accepted, because it already grants full access to its user.
- **Why it matters.** If a scoped token could reach token management, a narrow token (for
  example `npcs:read` on one game) could mint a new token with every scope on every game: a
  privilege escalation.
- **Two layers:**
  1. **Fail closed in the authentication class** (from [Scopes](scopes.md)). The token views
     declare no `@token_scopes`, so `ApiTokenAuthentication` rejects every scoped token with 403
     `token_not_allowed`. The #1603 coverage test lists them on its exclusion list.
  2. **An explicit guard in the views.** A new helper `require_session(request)`, next to
     `require_staff` in `backend/games/views/common.py`, returns
     `Response({'errors': {'detail': ['token_not_allowed']}}, status=403)` when
     `isinstance(request.auth, ApiToken)`, and `None` otherwise. All five token views (including
     `options.json`) call it first, **before** `require_staff`, so a scoped token always gets `token_not_allowed`.
     `@restricted` is the outermost decorator on every token view. This guard holds even if a
     `@token_scopes` declaration is later added by mistake, or the authentication check is
     refactored.
- A request carrying both a Bearer token and a session authenticates as the token (see
  [Tokens](tokens.md#authentication)), so it is refused.
- Rejected: **relying only on fail-closed.** It is a single layer for the most sensitive
  endpoints.
- Rejected: **a `@session_only` decorator that doubles as the coverage test's exclusion list.**
  Tidier, but it changes the mechanism #1595 settled for every excluded route. It can be
  proposed separately.

### Reachable game

- "Reachable" is defined once: **the games where the owner is DM, a player or a PC owner, plus
  every game for superusers**. Staff who are not superusers count as members only: staff power
  is about `staff/*`, not game content.
- This replaces the earlier "any game the owner's roles let them read". Game list and detail
  are `AllowAny`, so that wording would literally mean every game.
- The same helper or queryset validates `games` at creation, resolves `games: []` at request
  time, and builds the `games` list of [`options.json`](#options-get-accountapi_tokensoptionsjson),
  so the UI and the backend cannot disagree.
- Without this, a superuser could not limit a token to a game they are not a member of, and
  would be pushed towards the wider `[]`.

### Caching, proxy and Navi

**A Bearer request never reads from or writes to the proxy cache, on any rule. Its writes still
clear stale entries.**

This Bearer cache work (the proxy middleware, the rule changes and the backend safety net) is
implemented by #1643 (done), not #1604. #1604 ships only the token endpoints'
[own cache rules](#token-endpoints-and-navi).

Why: `rules/backend.php` caches every `.json` GET whoever the caller is, and
`rules/private_game_data_cache.php` ignores `X-Skip-Cache` and keys its entries on
`X-Cache-Token`. A Bearer request without that header would share the "empty token" entry with
every other header-less caller, and any cache hit would skip every Bearer check (401, 403
`token_not_allowed` / `game_not_allowed`). Tent matchers only look at the URI and the method, so
a rule cannot be selected by a header.

#### Bearer detection

The proxy and the backend use **one rule**: a request is a Bearer request when its whole
`Authorization` value, with several headers joined by commas, matches the case-insensitive
pattern `(^|,)\s*bearer(\s|$)`. This covers `bearer`, `BEARER`, a tab separator, leading spaces,
and a joined `Token x, Bearer mjr_…`. The backend treats every such value as a Majora token (see
[Tokens](tokens.md#transport)).

- Rejected: **a literal `Bearer ` prefix check.** It would miss variants the backend accepts,
  which would reopen the private-cache leak.

#### Proxy

- **`BearerSkipCacheMiddleware`** in `proxy/extension/lib/middlewares/`. On a Bearer request it
  adds a configurable marker header to the request. It is listed under `prependMiddlewares`, so
  it runs before `default_proxy`'s built-in `FileCacheMiddleware`, and both the cache read and
  the cache write are skipped.
  - `rules/backend.php`: the marker is `X-Skip-Cache: true`, which the rule already honours
    through `skip_cache_header`.
  - `rules/private_game_data_cache.php`: gets its own `skip_cache_header => 'X-Bearer-Request'`,
    and the middleware sets that header. It cannot use `X-Skip-Cache`, because its routes always
    send that header on the response, so honouring it would turn private caching off.
- **Second guard on the private rule:** it never stores or serves an entry when `X-Cache-Token`
  is missing or empty, so the shared "empty token" entry cannot exist. Implemented by the same
  middleware: on this rule it is configured with `skipWhenMissing => 'X-Cache-Token'`, so it
  also sets `X-Bearer-Request: true` when that header is missing or blank.
- `CacheCleanupMiddleware` and `ResponseCacheClearMiddleware` keep running for Bearer requests,
  so automation writes still clear collection and entity entries.
- The change applies to both `proxy/prod_configuration/rules/` and
  `proxy/dev_configuration/rules/`.
- **Other rules are unchanged.** `uploads.php`, `delete.php` and `staff_copies.php` do not cache
  responses, and `ForwardedHeaderFilter` already forwards `Authorization`.
- **Marker spoofing.** `skip_cache_header` works on presence alone, so a client that spoofs
  `X-Bearer-Request` (or `X-Skip-Cache`, which it can already send) only bypasses its own cache.
  It cannot poison anyone else's entries, so inbound copies are not stripped.

#### Backend safety net

Implemented as `accounts.middleware.BearerNoCacheMiddleware`, reusing
`accounts.authentication.BEARER_PATTERN`.


- A small Django middleware adds `X-Skip-Cache: true` **and `Cache-Control: no-store`** to every
  response to a Bearer request (same detection rule), whatever the status, including
  Django-level 404 and 500 responses.
- It is listed **after** `games.middleware.CacheControlMiddleware` in `MIDDLEWARE`, so it runs
  first on the way out. Otherwise `CacheControlMiddleware` would decide from `request.user` and
  could send `public, max-age`.
- If the proxy middleware were missing or misconfigured, `backend.php` would still never store a
  Bearer response. On its own it cannot stop a cache *hit*, and the private rule ignores it, so
  it complements the proxy change and does not replace it.
- The backend never reads `X-Bearer-Request`: Django is reachable directly on Render, so it must
  not trust it.

#### Token endpoints and Navi

- Every token endpoint has a single private variant and sets `X-Skip-Cache: true`, so the proxy
  never caches it (see [`no-private-cache-routes.md`](../../no-private-cache-routes.md)).
- **Navi needs no change.** Warm-up requests never carry a Bearer token, and token endpoints stay
  out of the warm-up chain (see [`cache-warmer.md`](../../cache-warmer.md)).

#### Rejected

- **A Tent header matcher plus a dedicated `rules/bearer.php`.** It needs an upstream Tent
  release, and the new rule would duplicate `backend.php`'s middleware stack (client IP, cache
  cleanup), which could drift.
- **Backend `X-Skip-Cache` only.** It cannot stop cache hits, and the private rule ignores it.
- **Skipping the cache on any `Authorization` header.** It would turn the cache off for the SPA,
  which sends `Authorization: Token` on every request.
- **Caching Bearer responses per token** (for example by hashing the token into the cache key).
  Revocation must take effect at once, and a cached response could outlive the token by up to
  the staleness window.

### Secret handling, logging and audit

- `ApiToken` gets no `HistoricalRecords`, or excludes the hashed secret from them, so the hash
  never outlives revocation. The hash is hidden in the Django admin.
- The `Authorization` header and the create response body are never logged.
- Staff revocations are logged (token pk, `user_id`, action, acting staff id; never the secret
  or the hash), as `_recovery_token_shared.log_recovery_token_action` does for recovery tokens.
  The user is not notified.
- Rejected: **staff creating a token on behalf of a user.** It would be impersonation.

### CSRF

- Session-authenticated API views have no CSRF-token check (`CookieTokenAuthentication` never
  calls `enforce_csrf`). Cross-site writes are stopped by `SESSION_COOKIE_SAMESITE = 'Lax'` and
  by CORS without credentials.
- The remaining path is a same-site origin (a sibling subdomain, or one hit by XSS) sending a
  plain HTML form POST with a form-encoded body. On the create endpoint this would make a junk
  token in the victim's account; the attacker could never read its secret. PATCH and DELETE
  cannot be forged that way.
- **Decision:** every token view sets `@parser_classes([JSONParser])`, so a form-encoded body
  gets 415. The project-wide posture is tracked separately in #1618.

### Edge cases

- **Duplicate names are allowed.** One owner may hold several tokens with the same name; the
  prefix tells them apart. Rejected: a unique constraint, which adds a 400 code and a
  create/rename race for little gain.
- **The owner loses access to a listed game** (removed as a player, a PC transferred). The token
  is neither revoked nor edited. Its requests on that game fail under the owner's roles, because
  scopes are intersected with roles, so nothing widens. The game stays in the list, so the owner
  sees what the token was made for.
- **`games: []` follows the owner over time.** It covers every game the owner can reach at
  request time, including games joined after the token was created. The token UI copy says so.
- **Deleted games.** If the only game on a token's list were deleted, the M2M row would vanish,
  the list would become `[]`, and the token would silently widen to every game. The app has no
  endpoint that deletes a game today. **Any game delete endpoint added later must revoke (delete)
  every `ApiToken` whose list contains that game**, in the same transaction; the token is never
  just narrowed. Known, accepted limitation: a game deleted through the Django admin or a shell
  bypasses the rule, as with the auto-revoke gap in [Tokens](tokens.md#auto-revoke-on-owner-status-change).
- **Staff and superusers.**
  - Staff may revoke their own tokens through the staff endpoint, with the same effect as the
    owner endpoint.
  - Staff may list and revoke a superuser's tokens, following the recovery-token precedent
    (`user.md` has no hierarchy guard).
  - A token never grants anything beyond its owner's roles, but a superuser's roles reach every
    game, so a superuser token with `games: []` and `npcs:write` can write NPCs in every game. No
    staff scopes exist, and `staff/*` is never reachable with a token. The token UI (#1605) warns
    superusers who leave the games list empty, driven by `all_games` in `options.json`. Plain
    staff reach member games only, so they get no special warning.
- **Expiry.**
  - `expires_at` must be strictly after the server's current time. A naive datetime is read in
    the server timezone, as DRF does under `USE_TZ`; the UI always sends UTC with an offset.
  - There is no upper bound, since "never" is allowed anyway.
  - An expired token can still be renamed and revoked, and stays in the list with status
    `expired`.
- **Concurrency.**
  - Rename and revoke racing each other: whichever runs second gets 404, or the rename's
    `filter().update()` matches nothing.
  - A second revoke of the same token gets 404.
  - A request already in flight when its token is revoked completes, because authentication has
    already happened.
- **Unapproved and inactive users.** Pending users get a session token at login, but
  `CookieTokenAuthentication` treats them as logged out, so they cannot create tokens. Denied
  users have their tokens deleted by the deny view. A user deactivated in the Django admin
  (`is_active = False`) is rejected by the Bearer class (see [Tokens](tokens.md#authentication)).

### Access-control documentation

These doc changes **ship with #1604**, following [`access-control.md`](../../access-control.md)'s
"update in the same PR" rule, so no page documents endpoints that do not exist yet.

- **New page `access-control/api-token.md`** (singular, like `user.md` and `upload.md`):
  - **Category:** an account resource on the owner side and a staff resource on the staff side
    (see [`principles.md`](../../access-control/principles.md)). Every endpoint sets
    `X-Skip-Cache: true` and has a single variant.
  - **Actions:** list, create, rename and revoke for the authenticated, approved owner; staff
    list and staff revoke for staff-or-superuser. Every row is marked **session only**, and a
    scoped token gets 403 `token_not_allowed`.
  - **Fields:** the token item; never the secret or its hash; the full token only in the create
    response. Only `name` is writable, anything else gives 400 `not_editable`. Nothing lets a
    caller widen a token's scopes or games after creation.
  - **Lookups:** scoped to the owner, or to the user in the URL; 404 otherwise.
  - **Lifecycle:** revoking deletes the row; the staff deny view auto-revokes every token; a
    future game delete endpoint must revoke every token that lists the game.
  - **Scope rules** live in [Scopes](scopes.md); the page states only who manages tokens.
- [`access-control.md`](../../access-control.md): list the new page under *Models / resources*.
- [`access-control/user.md`](../../access-control/user.md): add the two staff rows, linking to
  `api-token.md`, and say that deny also deletes the user's scoped tokens.
- [`access-control/principles.md`](../../access-control/principles.md): add `account/api_tokens`
  to the `account/*` routes, and the owner `DELETE account/api_tokens/<id>.json` to the non-staff
  `DELETE` exceptions.
- [`access-control/endpoints.md`](../../access-control/endpoints.md): add the 7 method + URL rows.
- [`no-private-cache-routes.md`](../../no-private-cache-routes.md): add `GET
  /account/api_tokens.json`, `GET /account/api_tokens/options.json` and `GET
  /staff/users/<id>/api-tokens.json`. They are credential
  metadata (or, for `options.json`, per-user data), never private-cache candidates.
- [`permissions.yaml`](../../permissions.yaml): no change. `own_account` and `staff` already
  describe these rules.

### Rejected at the page level

- **A create throttle and a per-owner token cap.** [Tokens](tokens.md#lifecycle) keeps "no
  per-user limit", and creation is session-only.
- **Making `expires_at` required.** A missing value keeps meaning "never".

### Testing strategy

#1604 must cover the following, and gets `security` and `data-access` reviews.

- **Auth and session-only:**
  - On all 7 method + URL pairs, a scoped token with every scope gets 403 `token_not_allowed`.
  - Forcing `request.auth` to an `ApiToken` proves `require_session` alone rejects the request.
  - A session cookie and a legacy `Token` succeed. Bearer plus session is refused.
  - Anonymous, pending and denied users get 401. An inactive user's Bearer token gets 401.
  - Bearer variants (`bearer`, `BEARER`, a tab, leading spaces) behave like `Bearer`.
    Malformed values (not exactly two parts) and a joined multi-header value give 401
    `token_invalid`.
  - Revoked and expired tokens get 401 at once.
- **Create:**
  - 201 returns the token item plus `token`, exactly once. Later lists never show the secret or
    hash.
  - Each error code: `name` (`required`, `blank`, `max_length`, and trimming); `scopes`
    (`required`, `empty`, `invalid_scope`, `duplicate_scope`, `max_length`); `games`
    (`game_not_reachable` for both unknown and unreachable, `duplicate_game`, `max_length`); `expires_at` (`invalid` and
    `expires_in_past`, with a "now" boundary test).
  - Several bad fields are reported together in one 400.
  - A missing `expires_at` and an explicit `null` both mean never.
  - `owner`, `prefix`, `id` or `last_used_at` in the body give 400 `not_editable`; the token
    always belongs to `request.user`.
  - Superuser and staff reachability follows the [reachable game](#reachable-game) rule: a
    superuser may pick any game, and a plain staff user who is not a member gets
    `game_not_reachable`.
  - A form-encoded body gives 415.
  - A prefix collision is retried, and exhausting the retries gives 500 (mocked).
- **Rename and revoke:**
  - PATCH changes `name` only and returns 200 with the item. `scopes`, `games`, `expires_at`,
    `owner` or `prefix` in the body give 400 `not_editable`, and the row is unchanged.
  - DELETE returns 204 and removes the row. A second DELETE gives 404.
  - Another user's token id gives 404 on PATCH and DELETE, and the row is unchanged.
  - An expired token can be renamed and revoked.
- **Options:**
  - `scopes` is the full catalogue, sorted.
  - A member gets the games where they are DM, a player or a PC owner, sorted by name, with
    `all_games: false`.
  - A superuser gets every game with `all_games: true`.
  - A plain staff user gets their member games only, with `all_games: false`.
  - Anonymous, pending and denied users get 401; a scoped token gets 403 `token_not_allowed`.
  - The response carries `X-Skip-Cache: true`.
- **Lists:**
  - The owner list holds only the caller's tokens, newest first, as a plain array.
  - `scopes` is sorted, `games` is `{slug, name}`, `expires_at` is `null` for never, `status`
    is `active` or `expired`.
- **Staff:**
  - Staff and superusers can list and revoke any user's tokens, including a superuser's.
  - A non-staff user gets 403 `not_allowed`. An anonymous caller gets 401.
  - A token id under the wrong `user_id` gives 404. An unknown `user_id` gives 404.
  - Revocations are logged without the secret.
  - The deny view deletes the user's tokens, and re-approving does not restore them.
- **Edge cases:**
  - An owner who leaves a listed game gets a failure on that game, and the token is not
    revoked.
  - `games: []` covers a game the owner joins later.
  - No history row stores the hash.
- **Cache headers (backend):**
  - Every token endpoint returns `X-Skip-Cache: true`.
  - Responses to Bearer requests (200, 401, 403, 404, 500) carry `X-Skip-Cache: true` and
    `Cache-Control: no-store`.
  - `Token` and session responses are unchanged.
  - A forged `X-Bearer-Request` has no backend effect.
- **Proxy (PHPUnit, prod and dev configurations):**
  - The marker is set for every Bearer variant and for a joined `Token x, Bearer y`. It is not
    set for `Token`, a missing header or other schemes.
  - On `backend.php` and `private_game_data_cache.php`, a Bearer GET is never served from or
    written to the cache.
  - On the private rule, a GET without `X-Cache-Token` is never stored, and a later anonymous
    GET never receives it.
  - A Bearer POST still triggers `CacheCleanupMiddleware` and `ResponseCacheClearMiddleware`.
  - `Token` and cookie GETs are still cached.
  - A forged marker header only skips the sender's own cache.

## Open questions

None. Every open question was settled by #1596 and recorded under [Decisions](#decisions).

## Affected code

- `backend/accounts/`: the owner views (including `options.json`) and serializers, the
  reachable-games helper, and the new `backend/accounts/urls/api_tokens.py`.
- `backend/staff/urls.py` and the staff views: the staff list and revoke endpoints, next to the
  recovery-token ones.
- `backend/games/views/common.py`: the new `require_session` helper, next to `require_staff`,
  `validated_or_error` and `_error_codes`.
- The new backend Bearer safety-net middleware, and its position after
  `games.middleware.CacheControlMiddleware` in `MIDDLEWARE`
  (`backend/majora_project/settings.py`) (#1643).
- `proxy/extension/lib/middlewares/`: the new `BearerSkipCacheMiddleware` (#1643).
- `rules/backend.php` and `rules/private_game_data_cache.php`, in both
  `proxy/prod_configuration/rules/` and `proxy/dev_configuration/rules/` (#1643).
- [`access-control.md`](../../access-control.md), the new `access-control/api-token.md`,
  [`access-control/user.md`](../../access-control/user.md),
  [`access-control/principles.md`](../../access-control/principles.md),
  [`access-control/endpoints.md`](../../access-control/endpoints.md) and
  [`no-private-cache-routes.md`](../../no-private-cache-routes.md) (shipped with #1604).
- [`permissions.yaml`](../../permissions.yaml): the `own_account` and `staff` resources,
  unchanged.
- `navi/`: the warm-up chain, unchanged; it must not include token endpoints.
