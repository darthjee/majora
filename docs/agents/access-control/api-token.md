# ApiToken (Scoped API Tokens)

**[Account resource](principles.md#resource-categories) on the owner side, and
[staff resource](principles.md#resource-categories) on the staff side.** Scoped API tokens
(`accounts.ApiToken`) let automation call the API as their owner. This page covers the token
model, authentication and who may manage tokens; what a token may do is in
[Token scopes](token-scopes.md).

Every endpoint has a single variant and always sets `X-Skip-Cache: true` per the
[`X-Skip-Cache` rule](principles.md#x-skip-cache-rule).

## Actions

Every action is **session only**: a cookie session or the legacy `Authorization: Token` header.
A request authenticated by a scoped token, whatever its scopes, gets
`403 {"errors": {"detail": ["token_not_allowed"]}}`. The views check this inline
(`require_session`) before any other check, on top of the `account/` and `staff/` route
exclusion in `ApiTokenAuthentication`.

| Action | Who can |
|--------|---------|
| List own tokens (`GET /account/api_tokens.json`) | **Authenticated** (approved) owner, session only |
| Create-form options (`GET /account/api_tokens/options.json`) | **Authenticated** (approved) owner, session only |
| Create (`POST /account/api_tokens.json`) | **Authenticated** (approved) owner, session only |
| Rename (`PATCH /account/api_tokens/<id>.json`) | **Authenticated** (approved) owner, session only |
| Revoke (`DELETE /account/api_tokens/<id>.json`) | **Authenticated** (approved) owner, session only |
| Staff list (`GET /staff/users/<user_id>/api-tokens.json`) | **Staff-or-superuser**, session only |
| Staff revoke (`DELETE /staff/users/<user_id>/api-tokens/<token_id>.json`) | **Staff-or-superuser**, session only |

- No session (anonymous, `pending` or `denied`) gets `401`. A non-staff session on a staff
  endpoint gets `403` `not_allowed`.
- Every view only accepts JSON bodies: a form-encoded body gets `415`.
- Staff may list and revoke any user's tokens, a superuser's and their own included. Staff
  revocations are logged (token pk, `user_id`, action, acting staff id); the user is not
  notified. Staff can never create a token on behalf of a user.

## Fields

- **Token item** (lists and rename response): `id`, `name`, `prefix`, `scopes` (sorted),
  `games` (`[{slug, name}]`, `[]` meaning every [reachable game](#reachable-games)),
  `expires_at` (`null` for never), `last_used_at`, `created_at`, `status`
  (`active`/`expired`).
- The secret and its hash are never serialized. The full `token` appears only in the create
  response, once.
- **Create** accepts `name`, `scopes`, `games` and `expires_at` only; the owner is always the
  caller. **Rename** accepts `name` only. Any other field gives `400` `not_editable`, keyed by
  the field. Nothing lets a caller widen a token's scopes or games after creation.
- **Options** returns the scopes the caller may grant, the caller's reachable games and
  `all_games` (`true` for superusers). The staff-only scopes (`STAFF_ONLY_SCOPES`, today
  `statistics:read`) are listed only for admin/staff callers.
- **Staff-only scopes:** creating a token with `statistics:read` for a non-staff owner gives
  `400` `scope_staff_only`; the scope is never silently stripped. The token then reaches
  `GET /staff/statistics/export.json`, the only staff route open to scoped tokens, and only
  while its owner is still staff (see
  [Token scopes](token-scopes.md#statistics)).

## Lookups

- Owner endpoints look tokens up by `owner=request.user`; staff endpoints by `owner_id=user_id`.
  A token outside that scope, or an unknown `user_id`, gives `404`, so enumerating pks reveals
  nothing.
- Lists are newest first (`-created_at`), with no pagination.

## Lifecycle

- Revoking deletes the row; there is no soft revoke. An expired token can still be renamed and
  revoked.
- The staff deny view ([User (Staff Management)](user.md)) deletes every token of the user;
  re-approving does not restore them.
- Deleting a game (through any path, Django admin and shell included) revokes every token whose
  game list becomes empty, so a token restricted to that game never widens to `[]`. Tokens that
  still list other games keep them. This is done by the `pre_delete` / `post_delete` signals in
  `backend/accounts/signals.py` (`connect_game_token_revocation(Game)`, wired in
  `accounts/apps.py`).
- A user moved out of `approved` only through the Django admin or a shell keeps their tokens,
  which stop working at once (the owner must be approved) and work again on re-approval. Only the
  staff deny view deletes them. This is a known, accepted limitation.
- Duplicate names are allowed; the prefix tells tokens apart. There is no per-user token limit
  and no create throttle.
- An owner who loses access to a listed game keeps the token unchanged: its requests on that
  game fail under the owner's roles, so nothing widens.
- A request already in flight when its token is revoked completes. Rename and revoke racing
  each other: the second one gets `404`.

## Token format and authentication

- **Format:** `mjr_<prefix>_<secret>`, 56 characters: an 8-character base62 prefix and a
  43-character base62 secret (about 256 bits), drawn with Python's `secrets.choice`. Base62 has
  no `_` or `-`, so splitting is unambiguous and double-click selects the whole token. The `mjr_`
  tag lets secret scanners spot a leaked token.
- **Storage** (`backend/accounts/models/api_token.py`): `owner`, `name`, `hashed_secret`,
  `prefix` (unique, indexed, non-secret, shown in lists), `scopes` (JSON list), `games` (M2M to
  `Game`), `expires_at`, `last_used_at`, `created_at`. There is no `revoked_at`.
- **Hashing:** only the secret part is hashed, with plain SHA-256 (no salt, no pepper) and
  compared with `hmac.compare_digest`. The secret is server-generated and long, so a salt or a
  slow hash adds nothing; reviewers should not flag the missing salt.
- **Creation:** `ApiToken.objects.create_token(owner, name, scopes, games=None,
  expires_at=None)` returns `(api_token, plain)`. A prefix clash (`IntegrityError`) is retried up
  to 3 times, then the request fails with `500`.
- **Sending:** `Authorization: Bearer mjr_...`. The `Bearer` scheme keeps it apart from the
  legacy `Authorization: Token <key>`, which is still handled by `CookieTokenAuthentication`
  (used by the SPA and the crawler).
- **Bearer detection:** a request is a Bearer request when its whole `Authorization` value
  (several headers joined by commas) matches `BEARER_PATTERN`, the case-insensitive, ASCII-only
  `(^|,)\s*bearer(\s|$)`. The proxy and the backend cache safety net use the same rule (see
  [Proxy](../architecture/proxy.md)).
- **Class order:** `ApiTokenAuthentication` comes before `CookieTokenAuthentication` in
  `DEFAULT_AUTHENTICATION_CLASSES`. A Bearer request is always a scoped request: when it also
  carries a session, the token decides and the session is ignored, so a dead token can never
  fall back to full session access.
- **Checks**, in order: the value splits into exactly two parts and the token matches
  `^mjr_([A-Za-z0-9]{8})_([A-Za-z0-9]{43})$`, prefix lookup, hash comparison, expiry, owner
  `is_active`, owner profile `approved`. Every failure raises the same `401` with code
  `token_invalid`, DRF's `{"detail": ...}` body and
  `WWW-Authenticate: Bearer realm="api", error="invalid_token"`, so nothing tells the caller
  which check failed. It never falls back to the session or to anonymous. Every other `401` in
  the API carries `WWW-Authenticate: Bearer realm="api"`.
- **On success** the class returns `(owner, api_token)`, so `request.auth` is the `ApiToken`,
  then runs the scope check (see [Token scopes](token-scopes.md#enforcement)).
- **Last used:** updated on every successful authentication, before the scope check, so a token
  refused with `403` still counts as used; failed authentications never update it. The write is a
  targeted `filter(pk=...).update(last_used_at=now)`, never `save()`, with no throttling.
- **Expiry:** optional and strictly in the future at creation, with no upper bound. A token is
  expired when `expires_at <= now`; expired tokens get `401` and stay in the list (status
  `expired`) until revoked.
- **Editing:** only the name. Scopes, games and expiry are fixed; to change them, create a new
  token and revoke the old one.

## Reachable games

"Reachable" is defined once, in `backend/accounts/api_tokens.py`: `reachable_games(user)` is
every game for a superuser, otherwise the games where the user is a player (DM or not, through
`players__user`). Plain staff count as members only. The same helper validates `games` at
creation, builds the `games` list of `options.json` (sorted by name) and gives `all_games`
(`reaches_all_games`, true for superusers), so the UI and the backend cannot disagree.

## Endpoint details

- **Decorators:** every token view has `@restricted` outermost (setting `X-Skip-Cache: true`),
  then `@api_view` and `@permission_classes([AllowAny])`, with the checks done inline (JSON-only
  bodies come from the global `REST_FRAMEWORK['DEFAULT_PARSER_CLASSES']`, see
  [CSRF](../security-guidelines/csrf.md)): `session_owner_error` (`require_session` then `require_authenticated`)
  on the owner views, `staff_session_error` (`require_session` then `require_staff`) on the staff
  views. `require_session` lives in `backend/games/views/common.py`.
- **Create** (`POST /account/api_tokens.json`) returns `201` with the token item plus
  `"token": "mjr_<prefix>_<secret>"`, the only response that ever carries it. A missing
  `expires_at` means never, like `null`.
- **Rename** returns `200` with the item; **revoke** returns `204` with no body.
- **Lists** are plain arrays, newest first; each item's `games` is sorted by name.
- **Options** (`GET /account/api_tokens/options.json`):
  `{"scopes": [sorted grantable scopes], "games": [{"slug", "name"}], "all_games": false}`;
  `statistics:read` is in `scopes` only for admin/staff callers.

### Validation codes (`400`)

All field errors come together in one `{"errors": {"<field>": ["<code>"]}}` response; an entry
error in a list is keyed by its position (`{"errors": {"scopes": {"1": ["max_length"]}}}`).

| Field | Codes |
|---|---|
| `name` | `required`, `blank`, `max_length` (100, after trimming) |
| `scopes` | `required`, `empty`, `invalid_scope`, `scope_staff_only` (a staff-only scope such as `statistics:read` for a non-staff owner), `duplicate_scope`, `max_length` (more entries than the catalogue, or an entry over 64 characters) |
| `games` | `duplicate_game` (checked first), `game_not_reachable` (unknown or unreachable slug, one code so slugs cannot be probed), `max_length` (over 100 slugs, or a slug too long) |
| `expires_at` | `invalid`, `expires_in_past` |
| any other field | `not_editable`, keyed by the field (on create anything outside `name`, `scopes`, `games`, `expires_at`; on rename anything but `name`) |

A form-encoded body gets `415`.

## Secret handling, logging and audit

- `ApiToken` has no `HistoricalRecords` and is not registered in the Django admin, so the hash
  never outlives revocation and is never displayed.
- The `Authorization` header and the create response body are never logged.
- Staff revocations are logged at INFO by `log_api_token_action`
  (`backend/staff/views/_api_token_shared.py`): action, token id, `user_id` and acting staff id,
  never the secret or the hash. The user is not notified.
- See also [Authentication guidelines](../security-guidelines/authentication.md#scoped-api-tokens).
