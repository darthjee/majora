# Issue: Client spec: improve token-api.md

## Description

Part of epic #1592 (Majora client for automations, with fine-grained API tokens). The epic records the agreed design: scope, permission model, token lifecycle, client shape and token management permissions.

Review `docs/agents/specs/client/token-api.md`, written in the epic's first sub-issue, and fill any gaps
before implementation starts. Topic: owner and staff token endpoints, access control, X-Skip-Cache, and proxy and cache handling of Bearer requests.

### What to do

- Read the page against the epic's decisions and the existing code and docs it touches.
- Resolve open questions, edge cases, backward compatibility, testing strategy and security or
  performance concerns for this aspect. Consult the `product-owner`, `security` or
  `data-access` agents where relevant.
- Update the page and, if needed, the hub `docs/agents/specs/client.md`.

### Notes

If the page already needs no work, close this issue as not needed.

Spun off: #1618 (project-wide CSRF posture).

## Problem

`token-api.md` leaves six open questions: the URL shapes, the payloads, the error codes, proxy
and Navi handling of `Authorization: Bearer`, and the access-control page. Exploring them turned
up a real leak. `rules/private_game_data_cache.php` ignores `X-Skip-Cache` and keys its entries
on `X-Cache-Token`, so a Bearer request without that header would share one cache entry with
every other header-less caller. A cache hit would also skip every Bearer check (401, 403
`token_not_allowed` / `game_not_allowed`).

## Expected Behavior

- `docs/agents/specs/client/token-api.md` records every decision below. Its *Open questions*
  section becomes "None", and its *Affected code* list is updated: the proxy middleware, both
  proxy rules, the backend safety-net middleware, `backend/games/views/common.py`
  (`require_session`), and the access-control pages.
- `docs/agents/specs/client/tokens.md` gains the `user.is_active` Bearer check and the shared
  [Bearer detection](#bearer-detection) rule.
- The hub `docs/agents/specs/client.md` is updated if any summary there changes.
- The page is ready to drive implementation sub-issue #1604. This issue changes docs only.

## Solution

### Proxy and Navi handling of Bearer requests

#### Findings

- `rules/backend.php` caches every `.json` GET whoever the caller is, and skips the cache only
  when `X-Skip-Cache` is on the request or the response. The SPA sends `Authorization: Token …`
  on every request (`frontend/assets/js/client/BaseClient.js`), so skipping on any
  `Authorization` header would turn the cache off for every logged-in user. The check must target
  `Bearer` only.
- `rules/private_game_data_cache.php` (`npcs/all.json`, `pcs|npcs/<id>/full.json`) ignores
  `X-Skip-Cache` and keys its entries on `X-Cache-Token`. A Bearer request without that header
  falls into the shared "empty token" entry, so one user's restricted response could be served to
  another caller. And two tokens of the same owner, with different scopes, would share one entry.
  **This leaks data, so the proxy must change.**
- Even on public routes, a cache hit skips every Bearer check: an invalid token would get a 200
  instead of a 401, and `token_not_allowed` / `game_not_allowed` would never fire.
- Tent matchers only look at the URI and the method, so a rule cannot be selected by a header.

#### Decision

**A Bearer request never reads from or writes to the proxy cache, on any rule. Its writes still
clear stale entries.**

1. **Proxy: a custom prepended middleware** (`BearerSkipCacheMiddleware` in
   `proxy/extension/lib/middlewares/`). When the request is a Bearer request (see [Bearer
   detection](#bearer-detection)), it adds a configurable marker header to the request. It is listed under
   `prependMiddlewares`, so it runs before `default_proxy`'s built-in `FileCacheMiddleware`, and
   the cache read and write are both skipped.
   - `rules/backend.php`: the marker is `X-Skip-Cache: true`, which the rule already honours
     through `skip_cache_header`.
   - `rules/private_game_data_cache.php`: gets its own `skip_cache_header => 'X-Bearer-Request'`,
     and the middleware is configured to set that header. It cannot use `X-Skip-Cache`, because
     its routes always send that header on the response, so honouring it would turn private
     caching off.
   - `CacheCleanupMiddleware` and `ResponseCacheClearMiddleware` keep running for Bearer
     requests, so automation writes still clear collection and entity entries.
   - **Second guard on the private rule:** it never stores or serves an entry when
     `X-Cache-Token` is missing or empty, so the shared "empty token" entry cannot exist.
   - The same change goes into `proxy/dev_configuration/rules/`.
2. **Backend: a safety net.** A small Django middleware (or equivalent hook) adds
   `X-Skip-Cache: true` **and `Cache-Control: no-store`** to every response to a Bearer request
   (same detection rule), whatever the status, including Django-level 404 and 500 responses. It
   is listed **after** `games.middleware.CacheControlMiddleware` in `MIDDLEWARE`, so it runs
   first on the way out. Otherwise `CacheControlMiddleware` would decide from `request.user` and
   could send `public, max-age`. If the proxy middleware were missing or misconfigured,
   backend.php would still never store a Bearer response. On its own it cannot stop a cache *hit*,
   and the private rule ignores it, so it complements the proxy change and does not replace it.
3. **Other proxy rules need no change.** `uploads.php`, `delete.php` and `staff_copies.php` do
   not cache responses, and `ForwardedHeaderFilter` already forwards `Authorization`.
4. **Navi needs no change.** Warm-up requests never carry a Bearer token, and token endpoints
   stay out of the warm-up chain.

#### Bearer detection

The proxy and the backend use **one rule**: a request is a Bearer request when its whole
`Authorization` value, with several headers joined by commas, matches the case-insensitive
pattern `(^|,)\s*bearer(\s|$)`. This covers `bearer`, `BEARER`, a tab separator, leading
spaces, and a joined `Token x, Bearer mjr_…`. The backend Bearer class returns 401
`token_invalid` for any such value that is not exactly two parts (scheme and token). A literal
`Bearer ` prefix check was rejected: it would miss variants the backend accepts, which would
reopen the private-cache leak.

#### Marker header

`skip_cache_header` works on presence alone, so a client that spoofs `X-Bearer-Request` (or
`X-Skip-Cache`, which it can already send) only bypasses its own cache. It cannot poison anyone
else's entries, so inbound copies are not stripped. The backend never reads `X-Bearer-Request`;
Django is reachable directly on Render, so it must not trust it.

#### Rejected

- **A Tent header matcher plus a dedicated `rules/bearer.php`.** It needs an upstream Tent
  release, and the new rule would duplicate backend.php's middleware stack (client IP, cache
  cleanup), which could drift.
- **Backend `X-Skip-Cache` only.** It cannot stop cache hits, and the private rule ignores it.
- **Skipping the cache on any `Authorization` header.** It would turn the cache off for the SPA,
  which sends `Authorization: Token` on every request.
- **Caching Bearer responses per token** (for example by hashing the token into the cache key).
  Revocation must take effect at once, and a cached response could outlive the token by up to
  the staleness window.

#### Tests

- Proxy (PHPUnit): the middleware adds the marker for `Bearer …` (any header-name casing) and
  not for `Token …`, for a missing header, or for other schemes. On both rules a Bearer GET is
  neither served from nor written to the cache. A Bearer POST still triggers cache cleanup. A
  `Token`/cookie GET is still cached as before.
- Backend: responses to Bearer requests (2xx, 401, 403) carry `X-Skip-Cache: true`. Responses to
  `Token`/session requests are unchanged.

### URL shapes

#### Owner endpoints

They live in a new `backend/accounts/urls/api_tokens.py`. They use snake_case, like
`account/authorization_requests.json`.

| Method | URL | Action |
|---|---|---|
| GET | `account/api_tokens.json` | List the caller's tokens (metadata only). |
| POST | `account/api_tokens.json` | Create a token. The response carries the full token, once. |
| PATCH | `account/api_tokens/<int:token_id>.json` | Rename (name only). |
| DELETE | `account/api_tokens/<int:token_id>.json` | Revoke (deletes the row). |

#### Staff endpoints

They go in `backend/staff/urls.py`, next to the recovery-token routes. They use kebab-case, like
`recovery-tokens`.

| Method | URL | Action |
|---|---|---|
| GET | `staff/users/<int:user_id>/api-tokens.json` | List the user's tokens (metadata only). |
| DELETE | `staff/users/<int:user_id>/api-tokens/<int:token_id>.json` | Revoke (deletes the row). |

#### Decisions

- **One view per URL, with several methods** (`['GET', 'POST']` and `['PATCH', 'DELETE']`),
  following the existing pattern.
- **The id in the URL is the integer pk**, matching `recovery-tokens`. Enumerating pks reveals
  nothing, because every lookup is scoped (next point).
- **Scoped lookups, and 404 for anything outside the scope.** The owner views look tokens up with
  `owner=request.user`. The staff view looks them up with `owner_id=user_id`, so a token id that
  does not belong to the user in the URL gives 404, as `staff_user_recovery_token_delete` does.
  An unknown `user_id` also gives 404.
- **Each area keeps its own naming style:** snake_case under `account/`, kebab-case under
  `staff/`.
- **No single-token GET.** The token UI only needs the list.
- **No proxy rule conflicts.** `delete.php` only catches photo DELETEs, so every token route
  falls to `rules/backend.php`. There, the single `X-Skip-Cache: true` variant keeps them out of
  the cache.

#### Rejected

- **The token prefix as the URL id.** The prefix is what users recognise in the list, but these
  endpoints are session-only and driven by the UI, so it buys little and breaks the
  `recovery-tokens` precedent.

### Request and response payloads

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
  the owner can reach.
- `expires_at` is `null` when the token never expires.
- `status` is `active` or `expired`. It is a convenience field that the UI may recompute, like
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
- `scopes`: required and not empty. Every scope must come from the catalogue. Duplicates give
  400, as `scopes.md` already says.
- `games`: optional list of slugs, defaulting to `[]`. Every slug must be a game the owner can
  reach. Duplicates give 400.
- `expires_at`: optional ISO 8601 datetime in the future, or `null` for never. **The token UI
  turns the presets (30 or 90 days) and a custom date into this value**, so the backend accepts
  a single form.
- **Missing `expires_at` means never**, the same as `null`. Making the field required was
  considered and rejected; the token UI still offers the presets.
- **`owner` is always `request.user`.** Any field other than `name`, `scopes`, `games` and
  `expires_at` (for example `owner`, `prefix`, `id`, `last_used_at`) is rejected with 400
  `not_editable`, the same as on PATCH.
- **JSON bodies only.** Every token view sets `@parser_classes([JSONParser])`, so a
  form-encoded body gets 415 (see [CSRF](#csrf)).
- Returns **201** with the token item plus `"token": "mjr_<prefix>_<secret>"`. This is the only
  response that ever carries the full token.

#### Rename: `PATCH account/api_tokens/<id>.json`

- Body `{"name": "..."}`, with the same rules as on create. Returns **200** with the updated
  token item.
- **Any other field in the body (scopes, games, expiry, …) is rejected with 400**, so a client
  never believes it changed something that cannot be edited. DRF's default of ignoring unknown
  fields is not used.

#### Revoke

- `DELETE account/api_tokens/<id>.json` and
  `DELETE staff/users/<user_id>/api-tokens/<token_id>.json` return **204** with no body.

#### Lists

- `GET account/api_tokens.json` and `GET staff/users/<user_id>/api-tokens.json` return a plain
  JSON array of token items, newest first (`-created_at`), with no pagination. This matches the
  recovery-token list.

### Deleted games and the token game list

- **Risk.** A token's game list is an M2M. If a game on the list is deleted, its row vanishes.
  If it was the only game, the list becomes `[]`, which means *every game*, and the token
  silently widens.
- **Today.** The app has no endpoint that deletes a game, so the risk cannot happen through the
  app.
- **Rule for the future.** Any game delete endpoint added later must **revoke (delete) every
  `ApiToken` whose game list contains that game**, in the same transaction as the game deletion.
  The token is never just narrowed. Record this rule in `token-api.md` and in the games
  access-control page, so whoever adds that endpoint finds it.
- **Known, accepted limitation.** A game deleted through the Django admin or a shell bypasses
  the rule, as with the auto-revoke gap in `tokens.md`.

### Error codes and bodies

Errors use the project's existing shape, `{"errors": {"<field>": ["<code>"]}}`, produced by
`validated_or_error` and `_error_codes` (`backend/games/views/common.py`). The codes that
`scopes.md` and `tokens.md` already define are kept as they are.

#### Validation: 400 on create or rename

All field errors are reported together in one response.

| Field | Case | Code |
|---|---|---|
| `name` | missing / blank / over 100 characters | `required` / `blank` / `max_length` (DRF defaults) |
| `scopes` | missing / empty list | `required` / `empty` |
| `scopes` | entry not in the catalogue | `invalid_scope` |
| `scopes` | the same entry twice | `duplicate_scope` |
| `games` | unknown slug, or a game the owner cannot reach | `game_not_reachable` (one code for both, so slugs cannot be probed) |
| `games` | the same slug twice | `duplicate_game` |
| `expires_at` | not a datetime / not in the future | `invalid` / `expires_in_past` |
| any field other than `name` on PATCH | `scopes`, `games`, `expires_at`, … | `not_editable`, keyed by the field, e.g. `{"errors": {"scopes": ["not_editable"]}}` |
| any field outside `name`, `scopes`, `games`, `expires_at` on create | `owner`, `prefix`, `id`, … | `not_editable`, keyed by the field |

#### Access

| Case | Status | Body |
|---|---|---|
| No session (anonymous, or an unapproved user) | 401 | The existing `unauthenticated_response`. |
| Request authenticated by a scoped token, whatever its scopes | 403 | `{"errors": {"detail": ["token_not_allowed"]}}` (from `scopes.md`). |
| Non-staff session on a staff endpoint | 403 | `{"errors": {"detail": ["not_allowed"]}}` (from `require_staff`). |
| Invalid Bearer token | 401 | `token_invalid` (from `tokens.md`). |
| Token id not owned by the caller (owner) or by `user_id` (staff), or unknown `user_id` | 404 | DRF's default via `get_object_or_404`, like the recovery-token endpoints. |

#### Other

- A form-encoded body gives **415** (DRF's default body).
- If all 3 prefix retries fail, the request fails with a 500. With about 2×10¹⁴ possible
  prefixes this does not happen in practice, so it gets no dedicated code.

### Session-only enforcement

#### What "session-only" means

A request is "session" when it is authenticated by `CookieTokenAuthentication`. That covers the
browser cookie **and** the legacy `Authorization: Token <key>` that the SPA itself sends
(`frontend/assets/js/client/BaseClient.js`). The only thing refused is a request whose
`request.auth` is an `ApiToken`. A legacy DRF `Token` (for example the crawler's) can therefore
manage scoped tokens. This is accepted, because the legacy token already grants full access to
its user.

#### Why it matters here

If a scoped token could reach token management, a narrow token (for example `npcs:read` on one
game) could mint a new token with every scope on every game. That is a privilege escalation, not
just over-reach.

#### Decision: two layers

1. **Fail closed in the authentication class** (from `scopes.md`). The token views declare no
   `@token_scopes`, so `ApiTokenAuthentication` rejects every scoped token with 403
   `token_not_allowed`. The #1603 coverage test lists them on its exclusion list.
2. **An explicit guard in the views.** A new helper `require_session(request)`, next to
   `require_staff` in `backend/games/views/common.py`, returns
   `Response({'errors': {'detail': ['token_not_allowed']}}, status=403)` when
   `isinstance(request.auth, ApiToken)`, and `None` otherwise. All four token views (the owner
   collection, the owner entity, the staff list and the staff revoke) call it first, **before**
   `require_staff`, so a scoped token always gets `token_not_allowed`. `@restricted` is the
   outermost decorator on every token view. This protects the views if a `@token_scopes` declaration is
   added to them by mistake later, or if the authentication check is refactored.

#### Tests

- For each token endpoint and method: a scoped token (valid, with every scope) gets 403
  `token_not_allowed`.
- A test that bypasses the authentication class (forcing `request.auth` to an `ApiToken`) proves
  that `require_session` alone rejects the request.
- A session cookie and a legacy `Authorization: Token` both succeed.
- A request carrying both a Bearer token and a session is refused (the token decides, see
  `tokens.md`).

#### Rejected

- **Relying only on fail-closed.** It is a single layer for the most sensitive endpoints.
- **A `@session_only` decorator that doubles as the coverage test's exclusion list.** It is
  tidier, but it changes the mechanism #1595 settled for every excluded route. It can be
  proposed separately.

### Access-control documentation

These doc changes **ship with #1604**, following `access-control.md`'s "update in the same PR"
rule. #1596 only records the plan in `token-api.md`, so no page documents endpoints that do not
exist yet.

#### New page: `docs/agents/access-control/api-token.md`

The name is singular, like `user.md` and `upload.md`. The page covers the `ApiToken` resource on
both sides:

- **Category:** an account resource on the owner side and a staff resource on the staff side
  (see `principles.md#resource-categories`). Every endpoint sets `X-Skip-Cache: true` and has a single variant.
- **Action table:** list, create, rename and revoke are allowed for the **authenticated, approved
  owner**. Staff list and staff revoke are allowed for **Staff-or-superuser**. Every row is
  marked **session only**, and a scoped token gets 403 `token_not_allowed`.
- **Fields:** the token item. It never includes the secret or its hash, and the full token
  appears only in the create response. Only `name` is writable, and anything else gives 400
  `not_editable`. As a self-privilege-escalation guard, nothing lets a caller widen a token's
  scopes or games after creation.
- **Lookups:** owner lookups are scoped to the owner, and staff lookups to the user in the URL.
  Anything outside that gives 404.
- **Lifecycle:** revoking deletes the row. The staff deny view auto-revokes every token. A future
  game delete endpoint must revoke every token that lists the game.
- **Where the scope rules live:** `../specs/client/scopes.md`. This page states only who manages
  tokens, not what a token may do.

#### Updates to existing pages

- `docs/agents/access-control.md`: list the new page under *Models / resources*.
- `access-control/user.md`: add the two staff rows, linking to `api-token.md`. In the deny
  paragraph, add that deny also deletes the user's scoped tokens.
- `access-control/principles.md`: add `account/api_tokens` to the list of `account/*` routes,
  and add the owner `DELETE account/api_tokens/<id>.json` to the list of non-staff `DELETE`
  exceptions.
- `access-control/endpoints.md`: add the 6 method + URL rows.
- `docs/agents/no-private-cache-routes.md`: add `GET /account/api_tokens.json` and
  `GET /staff/users/<id>/api-tokens.json`. They are credential metadata, so they are never
  private-cache candidates.
- `docs/agents/permissions.yaml`: no change. `own_account` and `staff` already describe these
  rules.

### Edge cases

- **Duplicate names are allowed.** One owner may hold several tokens with the same name, and the
  prefix tells them apart in the list. A unique constraint was rejected: it adds a 400 code and a
  create/rename race for little gain.
- **The owner loses access to a listed game** (for example, removed as a player, or a PC
  transferred). The token is neither revoked nor edited. Its requests on that game fail under
  the owner's roles, because scopes are intersected with roles, so nothing widens. The game
  stays in the token's list, so the owner can see what the token was made for. Unlike a game
  deletion (see above), the M2M row survives, so the list never empties.
- **`games: []` follows the owner over time.** It covers every game the owner can reach at
  request time, including games joined after the token was created. Say so in `token-api.md`
  and in the token UI copy.
- **Staff and superusers.**
  - Staff may revoke their own tokens through the staff endpoint, with the same effect as the
    owner endpoint.
  - Staff may list and revoke a superuser's tokens. This follows the recovery-token precedent:
    `user.md` has no hierarchy guard.
  - A token never grants anything beyond its owner's roles. That is not "nothing extra" for a
    superuser: their roles reach every game, so a superuser token with `games: []` and
    `npcs:write` can write NPCs in every game. No staff scopes exist, and `staff/*` is never
    reachable with a token. The token UI (#1605) warns staff and superusers who leave the games
    list empty.
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
- **Unapproved and inactive users.** Pending users do get a session token at login, but
  `CookieTokenAuthentication` treats them as logged out, so they cannot create tokens. Denied
  users have their tokens deleted by the deny view. A user deactivated in the Django admin
  (`is_active = False`) would otherwise keep working Bearer tokens, so `tokens.md`'s Bearer
  checks gain `user.is_active` (a small amendment to that page).

### Review outcomes

The `security`, `data-access` and `product-owner` agents reviewed the decisions above. The
proxy, payload, session-only and edge-case sections already include their fixes. The rest:

#### Reachable game

"Reachable" is defined once: **any game the owner's roles let them read**. The same helper or
queryset is used to validate `games` at creation and to resolve `games: []` at request time.
Without this, a superuser could not limit a token to a game they are not a member of, and would
be pushed towards the wider `[]`.

#### Secret handling and logging

- `ApiToken` gets no `HistoricalRecords`, or excludes `hashed_secret` from them, so the hash
  never outlives revocation. The hash is hidden in the Django admin.
- The `Authorization` header and the create response body are never logged.

#### Staff revoke audit

Staff revocations are logged (token pk, `user_id`, action, acting staff id; never the secret or
the hash), as `_recovery_token_shared.log_recovery_token_action` does for recovery tokens. The
user is not notified. Rejected: **staff creating a token on behalf of a user**, which would be
impersonation.

#### CSRF

- Session-authenticated API views have no CSRF-token check (`CookieTokenAuthentication` never
  calls `enforce_csrf`). Cross-site writes are stopped by `SESSION_COOKIE_SAMESITE = 'Lax'` and
  by CORS without credentials.
- The remaining path is a same-site origin (a sibling subdomain, or one hit by XSS) sending a
  plain HTML form POST with a form-encoded body. On the create endpoint this would make a junk
  token in the victim's account. The attacker could never read its secret. PATCH and DELETE
  cannot be forged that way.
- **Decision:** the token views accept JSON only (`@parser_classes([JSONParser])`). The
  project-wide posture is tracked separately in #1618.

#### Rejected

- **A create throttle and a per-owner token cap.** `tokens.md` (#1594) keeps "no per-user
  limit", and creation is session-only.
- **Making `expires_at` required.** A missing value keeps meaning "never".

### Testing strategy for #1604

**Auth and session-only**

- On all 6 method + URL pairs, a scoped token with every scope gets 403 `token_not_allowed`.
- Forcing `request.auth` to an `ApiToken` proves `require_session` alone rejects the request.
- A session cookie and a legacy `Token` succeed. Bearer plus session is refused.
- Anonymous, pending and denied users get 401. An inactive user's Bearer token gets 401.
- Bearer variants (`bearer`, `BEARER`, a tab, leading spaces) behave like `Bearer`. Malformed
  values (not exactly two parts) and a joined multi-header value give 401 `token_invalid`.
- Revoked and expired tokens get 401 at once.

**Create**

- 201 returns the token item plus `token`, exactly once. Later lists never show the secret or
  hash.
- Each error code:
  - `name`: `required`, `blank`, `max_length`, and trimming.
  - `scopes`: `required`, `empty`, `invalid_scope`, `duplicate_scope`.
  - `games`: `game_not_reachable` (the same code for unknown and unreachable),
    `duplicate_game`.
  - `expires_at`: `invalid` and `expires_in_past`, with a "now" boundary test.
- Several bad fields are reported together in one 400.
- A missing `expires_at` and an explicit `null` both mean never.
- `owner`, `prefix`, `id` or `last_used_at` in the body give 400 `not_editable`. The token
  always belongs to `request.user`.
- Superuser and staff reachability follows the "reachable game" rule.
- A form-encoded body gives 415.
- A prefix collision is retried, and exhausting the retries gives 500 (mocked).

**Rename and revoke**

- PATCH changes `name` only and returns 200 with the item. `scopes`, `games`, `expires_at`,
  `owner` or `prefix` in the body give 400 `not_editable`, and the row is unchanged.
- DELETE returns 204 and removes the row. A second DELETE gives 404.
- Another user's token id gives 404 on PATCH and DELETE, and the row is unchanged.
- An expired token can be renamed and revoked.

**Lists**

- The owner list holds only the caller's tokens, newest first, as a plain array.
- `scopes` is sorted. `games` is `{slug, name}`. `expires_at` is `null` for never. `status` is
  `active` or `expired`.

**Staff**

- Staff and superusers can list and revoke any user's tokens, including a superuser's.
- A non-staff user gets 403 `not_allowed`. An anonymous caller gets 401.
- A token id under the wrong `user_id` gives 404. An unknown `user_id` gives 404.
- Revocations are logged without the secret.
- The deny view deletes the user's tokens, and re-approving does not restore them.

**Edge cases**

- An owner who leaves a listed game gets a failure on that game, and the token is not revoked.
- `games: []` covers a game the owner joins later.
- No history row stores the hash.

**Cache headers (backend)**

- Every token endpoint returns `X-Skip-Cache: true`.
- Responses to Bearer requests (200, 401, 403, 404, 500) carry `X-Skip-Cache: true` and
  `Cache-Control: no-store`.
- `Token` and session responses are unchanged.
- A forged `X-Bearer-Request` has no backend effect.

**Proxy (PHPUnit, prod and dev configurations)**

- The marker is set for every Bearer variant and for a joined `Token x, Bearer y`. It is not set
  for `Token`, a missing header or other schemes.
- On `backend.php` and `private_game_data_cache.php`, a Bearer GET is never served from or
  written to the cache.
- On the private rule, a GET without `X-Cache-Token` is never stored, and a later anonymous GET
  never receives it.
- A Bearer POST still triggers `CacheCleanupMiddleware` and `ResponseCacheClearMiddleware`.
- `Token` and cookie GETs are still cached.
- A forged marker header only skips the sender's own cache.
