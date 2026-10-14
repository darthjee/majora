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
| hashed secret | A hash of the secret. The plain secret is never stored. |
| prefix | A short, non-secret identifier, shown in lists so users can recognise the token. |
| scopes | The resource × action scopes the token carries (see [Scopes](scopes.md)). |
| games | An optional list of games. Empty means every game the owner can reach. |
| expires at | Optional expiry. Empty means the token never expires. |
| last used at | When the token last authenticated a request. Shown in the token list. |
| created at | Creation timestamp. |

### Transport

- Scoped tokens are sent as `Authorization: Bearer mjr_<prefix>_<secret>`.
- The `Bearer` scheme keeps them apart from the legacy `Authorization: Token <key>`, so the two
  authentication classes never compete for the same header.
- The `mjr_` prefix lets secret scanners spot a leaked token.

### Lifecycle

- **Creation.** The owner, from a logged-in browser session, gives the token a name, its scopes,
  an optional list of games and an optional expiry: a preset (30 or 90 days), a custom date, or
  never. Creation goes through the [Token API](token-api.md).
- **Secret shown once.** The full token is returned only in the creation response. Only its hash
  and prefix are kept, so it can never be shown again.
- **Editing.** Only the name can change. Scopes, games and expiry are fixed: to change them, the
  user creates a new token and revokes the old one.
- **Expiry.** The API rejects expired tokens.
- **Last-used tracking.** Each authenticated request updates the token's last-used time.
- **Revocation.** Revoking takes effect at once, with no grace period.
- **No per-user limit** on the number of tokens.
- **Auto-revoke on owner status change.** When the owner's profile status leaves `approved`
  (becomes pending or denied), all of their tokens are revoked for good. Approving the user again
  does not bring them back. This includes the staff deny flow, which already destroys the user's
  DRF tokens (see [`access-control/user.md`](../../access-control/user.md)); it must destroy
  their scoped tokens too.

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

## Open questions

Settled by #1594:

- The hashing algorithm for the secret (and whether it needs a per-token salt, given the secret
  is long and random).
- The prefix and secret lengths, and the alphabet they use.
- Where the last-used update happens (the authentication class or a middleware), and how often
  it is written (every request, or throttled to avoid a write per call).
- The hook point for auto-revoke when the owner's status leaves `approved` (the status-change
  code path, a signal, or the deny view), and whether revoked tokens are deleted or kept with a
  revoked flag.
- How the authentication class reports a missing, malformed, expired or revoked token (status
  code and error body).

## Affected code

- `backend/accounts/authentication.py`: `CookieTokenAuthentication`; the new Bearer
  authentication class sits next to it.
- `backend/accounts/`: the user profile status and the staff deny flow that must trigger
  auto-revoke.
- Django REST framework settings: the list of authentication classes.
- [`access-control/user.md`](../../access-control/user.md): the deny flow and the
  recovery-token precedent.
- `crawler/` and the legacy DRF `Token`: unchanged, context only.
