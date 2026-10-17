# Issue: Scoped API tokens: ApiToken model and Bearer authentication

## Description

Part of epic #1592 (Majora client for automations, with fine-grained API tokens). Backend foundation for scoped API tokens: the `ApiToken` model, token generation, and the `Authorization: Bearer mjr_...` DRF authentication class. The full design lives in [`docs/agents/specs/client/tokens.md`](../specs/client/tokens.md); this issue implements it. Scope enforcement (#1603) and the token management endpoints are separate sub-issues.

## Problem

The only API token today is DRF's per-user `Token`, accepted by `CookieTokenAuthentication` through `Authorization: Token <key>`. It grants everything its user can do, cannot be scoped, is limited to one per user and is stored in plain text. Automations need many narrow, revocable, hashed tokens instead.

## Expected Behavior

- A valid `Authorization: Bearer mjr_<prefix>_<secret>` authenticates as the token's owner, with the `ApiToken` as `request.auth`.
- Any Bearer request that does not authenticate (malformed, unknown or revoked prefix, wrong secret, expired, inactive owner, unapproved owner) gives **401** with code `token_invalid` and `WWW-Authenticate: Bearer realm="api", error="invalid_token"`. It never falls back to the session or to anonymous.
- Requests without a Bearer header behave exactly as today: `CookieTokenAuthentication` and the legacy `Authorization: Token <key>` are unchanged, and `crawler/` keeps working.
- Denying a user through the staff deny view deletes all of their scoped tokens, alongside their DRF tokens.
- Until #1603 lands, a token that authenticates gets **403** `token_not_allowed` on every request (fail closed).

## Solution

### Model (`backend/accounts/models/`)

Add `ApiToken` and its migration, with the fields from the spec:

| Field | Definition |
|---|---|
| `owner` | FK to `User`. |
| `name` | User-chosen label. |
| `hashed_secret` | `CharField(max_length=64)`: SHA-256 hex digest of the secret part only. No salt (by design, see the spec). |
| `prefix` | Unique, indexed `CharField(max_length=8)`. |
| `scopes` | `JSONField` holding a list of strings. No catalogue validation here (see Out of scope). |
| `games` | Many-to-many to `Game`; empty means every game the owner can reach. |
| `expires_at` | Optional; empty means never. |
| `last_used_at` | Optional; set on successful authentication. |
| `created_at` | Creation timestamp. |

No `revoked_at`: revoking deletes the row.

### Generation

- Format `mjr_` + 8-char base62 prefix + `_` + 43-char base62 secret (56 chars), drawn with `secrets.choice` over `A-Za-z0-9` (not `token_urlsafe`).
- Only the hash and prefix are stored; the plain token is returned once to the caller.
- Retry up to 3 times when the unique `prefix` constraint raises `IntegrityError`.

### Authentication (`backend/accounts/authentication.py`)

- New `ApiTokenAuthentication`, placed **first**: `DEFAULT_AUTHENTICATION_CLASSES = [ApiTokenAuthentication, CookieTokenAuthentication]`.
- Bearer detection: the whole `Authorization` value matches case-insensitive `(^|,)\s*bearer(\s|$)`. No match → return `None`.
- Checks, in order: exactly two parts and token matches `^mjr_([A-Za-z0-9]{8})_([A-Za-z0-9]{43})# Issue: Scoped API tokens: ApiToken model and Bearer authentication

## Description

Part of epic #1592 (Majora client for automations, with fine-grained API tokens). Backend foundation for scoped API tokens: the `ApiToken` model, token generation, and the `Authorization: Bearer mjr_...` DRF authentication class. The full design lives in [`docs/agents/specs/client/tokens.md`](../specs/client/tokens.md); this issue implements it. Scope enforcement (#1603) and the token management endpoints are separate sub-issues.

## Problem

The only API token today is DRF's per-user `Token`, accepted by `CookieTokenAuthentication` through `Authorization: Token <key>`. It grants everything its user can do, cannot be scoped, is limited to one per user and is stored in plain text. Automations need many narrow, revocable, hashed tokens instead.

## Expected Behavior

- A valid `Authorization: Bearer mjr_<prefix>_<secret>` authenticates as the token's owner, with the `ApiToken` as `request.auth`.
- Any Bearer request that does not authenticate (malformed, unknown or revoked prefix, wrong secret, expired, inactive owner, unapproved owner) gives **401** with code `token_invalid` and `WWW-Authenticate: Bearer realm="api", error="invalid_token"`. It never falls back to the session or to anonymous.
- Requests without a Bearer header behave exactly as today: `CookieTokenAuthentication` and the legacy `Authorization: Token <key>` are unchanged, and `crawler/` keeps working.
- Denying a user through the staff deny view deletes all of their scoped tokens, alongside their DRF tokens.
- Until #1603 lands, a token that authenticates gets **403** `token_not_allowed` on every request (fail closed).

; prefix lookup; `hmac.compare_digest` of SHA-256 hashes; not expired; `user.is_active`; profile status `approved`. Every failure raises the same `AuthenticationFailed` (`token_invalid`).
- `authenticate_header` returns `Bearer realm="api"`; Bearer 401s add `error="invalid_token"`.
- On success, update `last_used_at` with `ApiToken.objects.filter(pk=...).update(...)` (never `save()`), then return `(owner, api_token)`.
- **Interim fail-closed:** until #1603 adds the real scope check, every Bearer request that authenticates is then refused with **403** `token_not_allowed`, so no deploy ever lets a token through with its owner's full access. `last_used_at` is still updated (authentication succeeded). #1603 replaces this blanket refusal with the per-view scope check, at the same point in the class.

### Auto-revoke (`backend/staff/views/staff_user_deny.py`)

Delete the user's `ApiToken` rows next to the existing `Token.objects.filter(user=user).delete()`. No signal or `save()` override (rejected in the spec).

### Tests

Cover the spec's [testing strategy](../specs/client/tokens.md#testing-strategy): generation format, prefix-clash retry, hash-only storage; Bearer variants detected; each failure case gives 401 `token_invalid`; valid token authenticates with `request.auth`; `last_used_at` updated only on success; Bearer + session never rescued by the session; deny view deletes scoped tokens; a valid token gets 403 `token_not_allowed` (interim fail-closed).

### Out of scope

- Scope enforcement on views, the `@token_scopes` decorator, and the 32-scope catalogue constant (#1603). Validating `scopes` and `games` on creation belongs to the token API.
- Django admin registration for `ApiToken`: not added. Staff revoke tokens by denying the user.
- Token management endpoints and UI (separate sub-issues).

## Benefits

- Lays the hashed, revocable, multi-token foundation the client epic builds on.
- Keeps legacy token and session flows untouched.
- Dead tokens fail loudly with 401 instead of silently reading public data.
