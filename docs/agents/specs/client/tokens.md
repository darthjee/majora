# Tokens

The scoped API token itself: the `ApiToken` model, how the secret is sent and stored, and the
token lifecycle. Part of the [client spec](../client.md) (epic #1592). Refined by #1594 and
implemented by #1602.

## Overview

Today the only API token is DRF's per-user `Token`, accepted by `CookieTokenAuthentication`
(`backend/accounts/authentication.py`) through `Authorization: Token <key>`. It grants everything
its user can do, it cannot be scoped, each user has at most one, and it is stored in plain text.

This epic adds a second, independent kind of token: a custom `ApiToken` model with its own DRF
authentication class. A user can hold many of them, each one narrowed by scopes (see
[Scopes](scopes.md)) and optionally by a list of games. The legacy `Token` stays as it is.

## Decisions

### Model

`ApiToken` has these fields:

| Field | Meaning |
|---|---|
| owner | The user the token acts for. Every request is checked against this user's roles. |
| name | A user-chosen label. The only field that can be edited after creation. |
| hashed secret | `CharField(max_length=64)`: the SHA-256 hex digest of the secret. The plain secret is never stored. |
| prefix | Unique, indexed `CharField(max_length=8)`: a short, non-secret identifier, shown in lists so users can recognise the token. |
| scopes | The resource × action scopes the token carries (see [Scopes](scopes.md)). |
| games | An optional list of games. Empty means every game the owner can reach. |
| expires at | Optional expiry. Empty means the token never expires. |
| last used at | When the token last authenticated a request. Shown in the token list. |
| created at | Creation timestamp. |

There is no `revoked_at` field: revoking deletes the row (see [Lifecycle](#lifecycle)).

### Transport

- Scoped tokens are sent as `Authorization: Bearer mjr_<prefix>_<secret>`.
- The `Bearer` scheme keeps them apart from the legacy `Authorization: Token <key>`, so the two
  authentication classes never compete for the same header.
- The `mjr_` prefix lets secret scanners spot a leaked token.
- **Exact format:** `mjr_`, an 8-character base62 prefix, `_`, and a 43-character base62
  secret: 56 characters in total. The authentication class parses it with an exact match of
  `^mjr_([A-Za-z0-9]{8})_([A-Za-z0-9]{43})$`.
- Every `Bearer` header is treated as a Majora token. A value that does not match the pattern is
  simply malformed (see [Error reporting](#error-reporting)).

### Token format

- **Alphabet: base62** (`A–Z a–z 0–9`) for both the prefix and the secret. It has no `_` or `-`,
  so splitting on the `_` separators is unambiguous, and double-clicking selects the whole token.
- **Generation:** characters are drawn uniformly with Python's `secrets` module,
  `''.join(secrets.choice(ALPHABET) for _ in range(n))`. `secrets.token_urlsafe` is not used,
  because base64url contains `_` and `-`.
- **Prefix: 8 characters** (about 2×10¹⁴ values), random and independent of the secret, so
  showing it leaks nothing. Creation retries up to 3 times when the unique constraint on `prefix`
  raises an `IntegrityError`.
- **Secret: 43 characters** (about 256 bits).
- **Rejected: base64url.** Its `_` and `-` break both parsing and double-click selection.
- **Rejected: hex.** About 50% longer for the same entropy.
- **Rejected: a checksum suffix** (like GitHub's CRC32). It would catch typos without a database
  query and help secret scanners, but it adds format, tests and client work for little gain at
  this project's size.

### Secret hashing

- **Chosen: plain SHA-256, no salt.** The secret is server-generated, long and random (about 256
  bits), so a salt or a slow hash adds nothing: brute force and precomputed tables are already
  infeasible. This is the usual scheme for API tokens (GitHub, Stripe, PyPI). Reviewers should
  not flag the missing salt: salts and slow hashes protect secrets that people choose, which this
  is not.
- **What is hashed:** only the secret part, not the whole `mjr_<prefix>_<secret>` string. It is
  stored as a 64-character hex digest.
- **Lookup:** find the token by `prefix` (unique, indexed), then compare the SHA-256 of the
  presented secret with the stored hash using `hmac.compare_digest`. That is one indexed query and
  a constant-time comparison.
- **Rejected: HMAC with a server-side pepper.** Rotating the key would break every token at once,
  and with a 256-bit random secret it adds little.
- **Rejected: Django password hashers (PBKDF2, Argon2).** They would add a slow hash (roughly
  100–300 ms) to every API call, and they only help with secrets that people choose.

### Authentication

- **Class order:** `DEFAULT_AUTHENTICATION_CLASSES = [ApiTokenAuthentication,
  CookieTokenAuthentication]` in `backend/majora_project/settings.py`. The Bearer class goes
  first.
- **A request with a Bearer header is always a scoped request.** When it also carries a session
  cookie, the token decides: a valid token gives a scoped request, a bad one gives 401, and the
  session is ignored. The reverse order would let `CookieTokenAuthentication` (which ignores the
  `Bearer` keyword) fall back to the session and authenticate the full-access user. That would
  silently skip the token's scopes, and a dead token would even appear to work.
- **Token management stays session-only.** A request carrying both a token and a session
  authenticates as the token, so the session-only checks in [Token API](token-api.md) refuse it.
- **Checks, in order:** format, prefix lookup, hash comparison, expiry, owner's profile status is
  `approved`. Like `CookieTokenAuthentication`, the Bearer class treats an unapproved owner as not
  authenticated. Every failure gives the same error (see [Error reporting](#error-reporting)), so
  the order leaks nothing.
- **On success** the class returns `(owner, api_token)`, so the `ApiToken` is `request.auth` (see
  [Scopes](scopes.md) for how scope checks read it).
- **Side effect:** every 401 across the API now carries `WWW-Authenticate: Bearer realm="api"`
  instead of `Token`, because DRF takes the header from the first authentication class. Nothing in
  the backend, frontend or proxy reads this header, browsers only prompt on `Basic`, and the
  status stays 401.
- **Unaffected:** views with `@authentication_classes([])` (`auth/status`, `auth/header_status`,
  `domains/config`, `games/ready`, `access_route_config`) still ignore every credential. Legacy
  `Authorization: Token <key>` requests never reach the Bearer class, so `crawler/` does not
  change.

### Error reporting

- **No `Authorization: Bearer` header:** the Bearer class returns `None` ("not mine") and DRF
  tries the next authentication class as usual.
- **Any `Bearer` header that does not authenticate:** the class raises `AuthenticationFailed`,
  which gives **401**. It never falls back to anonymous or to the session. An automation with a
  dead token must fail loudly rather than quietly read public data as anonymous. This
  deliberately differs from `CookieTokenAuthentication`, which swallows stale `Token` headers for
  the SPA's sake.
- **One generic error for every failure:** malformed header, unknown prefix (never existed or
  revoked), wrong secret, expired token and owner not approved all return the same 401 with code
  `token_invalid` and DRF's default body (`{"detail": ...}`). Nothing tells the caller which check
  failed.
- **`WWW-Authenticate`:** Bearer 401s carry `Bearer realm="api", error="invalid_token"`
  (RFC 6750). This relies on the Bearer class being first (see [Authentication](#authentication)).
- **Out of this page:** a valid token that lacks the scope a request needs gets **403**, never
  401. That is specified in [Scopes](scopes.md).

### Lifecycle

- **Creation.** The owner, from a logged-in browser session, gives the token a name, its scopes,
  an optional list of games and an optional expiry: a preset (30 or 90 days), a custom date, or
  never. Creation goes through the [Token API](token-api.md).
- **Secret shown once.** The full token is returned only in the creation response. Only its hash
  and prefix are kept, so it can never be shown again.
- **Editing.** Only the name can change. Scopes, games and expiry are fixed: to change them, the
  user creates a new token and revokes the old one.
- **Expiry.** The API rejects expired tokens with the generic 401. Expired tokens are not deleted
  automatically: they stay in the owner's list, shown as expired, until revoked.
- **No per-user limit** on the number of tokens.

#### Last-used tracking

- **Where:** in the Bearer authentication class, right after the token passes every check. The
  token row is already loaded there, and the token logic stays in one place.
- **Meaning:** "last used" means "last authenticated". A request that authenticates but is then
  refused by a scope check (403) still counts, so a leaked token being probed shows up as
  activity. Failed authentications (wrong secret, expired, owner not approved) never update it.
- **How often:** on every authenticated request, with no throttling. The write is a targeted
  `ApiToken.objects.filter(pk=token.pk).update(last_used_at=now)`, not `token.save()`, so it never
  overwrites other fields (for example a rename happening at the same time).
- **Deferred: throttling the write** (for example only when the stored value is older than 60
  seconds). It can be added later if the extra write per request becomes a measurable cost.
- **Rejected: a middleware or post-response hook.** DRF authenticates lazily, so a middleware
  would have to inspect `request.auth`, and the token logic would be split across files.

#### Revocation

- **Revoking deletes the row.** This covers owner revocation, staff revocation and auto-revoke.
  It takes effect at once, with no grace period. There is no `revoked_at` flag: a revoked token is
  gone for good and is never restored, so no lookup or list has to filter revoked rows. A revoked
  token looks unknown to the authentication class, the same as a token that never existed.

#### Auto-revoke on owner status change

- When the owner's profile status leaves `approved` (becomes pending or denied), all of their
  tokens are revoked for good. Approving the user again does not bring them back.
- **Hook point: inline in the staff deny view** (`backend/staff/views/staff_user_deny.py`), next
  to the existing `Token.objects.filter(user=user).delete()` (see
  [`access-control/user.md`](../../access-control/user.md)). That view is the only place in the
  app that moves a user out of `approved` (it denies from any status). The approve view never
  revokes.
- **Backed by the owner-status check:** the Bearer class rejects any token whose owner is not
  `approved` (see [Authentication](#authentication)). This covers status changes the deny view
  never sees (Django admin, shell): such tokens stop working at once.
- **Known, accepted limitation:** a user moved approved → pending → approved purely through the
  Django admin or a shell keeps their tokens, which then work again on re-approval.
- **Rejected: overriding `UserProfile.save()` or a `post_save` signal.** Either would close the
  admin gap, but it hides a side effect in `save()` (or adds the first signal to `accounts`) to
  fix a path the app itself never takes.

### Why a custom model

- **Chosen: a custom `ApiToken` model with a DRF authentication class.** It supports every
  decision above (hashed secret, scopes, list of games, expiry, last-used, auto-revoke), adds no
  dependency, and sits next to `CookieTokenAuthentication`.
- **Rejected: extending DRF's `Token`.** One token per user, stored in plain text.
- **Rejected: django-rest-knox.** No scopes or game lists, a login-based token flow that clashes
  with session-only creation, and a new dependency.
- **Rejected: OAuth2 (django-oauth-toolkit).** Far too heavy for personal automation tokens
  (client registration, grant flows, consent screens), and per-game restriction would still be
  custom. It could be reconsidered if third-party apps are ever wanted.

### Testing strategy

#1602 must cover:

- **Generation:** the token matches `^mjr_[A-Za-z0-9]{8}_[A-Za-z0-9]{43}$`; a prefix clash
  (`IntegrityError`) is retried; only the SHA-256 hash is stored; the plain token appears only in
  the creation response.
- **Authentication:** no `Bearer` header returns `None` (the next class runs). A malformed
  header, unknown prefix, wrong secret, expired token or unapproved owner each gives 401 with code
  `token_invalid`. A valid token authenticates as its owner, with the `ApiToken` as
  `request.auth`.
- **Last-used:** updated on a successful authentication, never on a failed one.
- **Class order:** with both a Bearer header and a session, a bad token gives 401 and is never
  rescued by the session; a valid token authenticates as the token, not the session.
- **Auto-revoke:** the staff deny view deletes the user's scoped tokens as well as their DRF
  tokens.

## Open questions

None. Every open question was settled by #1594 and recorded under [Decisions](#decisions).

## Affected code

- `backend/accounts/authentication.py`: `CookieTokenAuthentication`; the new Bearer
  authentication class (`ApiTokenAuthentication`) sits next to it.
- `backend/accounts/`: the new `ApiToken` model and its migration, and the user profile status
  the Bearer class checks.
- `backend/staff/views/staff_user_deny.py`: deletes the user's scoped tokens next to the existing
  DRF `Token` deletion (auto-revoke).
- `backend/majora_project/settings.py`: `DEFAULT_AUTHENTICATION_CLASSES`, with the Bearer class
  first.
- [`access-control/user.md`](../../access-control/user.md): the deny flow and the
  recovery-token precedent.
- [Token API](token-api.md): the session-only checks on the token management endpoints.
- [Scopes](scopes.md): the 403 on a missing scope, read from `request.auth`.
- `crawler/` and the legacy DRF `Token`: unchanged, context only.
