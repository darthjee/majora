# Token API

The backend endpoints that manage scoped tokens, and how the proxy and the cache treat requests
that carry one. Part of the [client spec](../client.md) (epic #1592). Refined by #1596 and
implemented by #1604.

## Overview

Two sets of endpoints manage [tokens](tokens.md):

- **owner endpoints**, where an approved user creates, lists, renames and revokes their own
  tokens;
- **staff endpoints**, where staff and superusers list and revoke any user's tokens.

Both are session-only: a scoped token can never call them (see [Scopes](scopes.md)). They are
consumed by the [Token UI](token-ui.md).

## Decisions

### Owner endpoints

- Any approved user can create, list, rename and revoke their own tokens.
- They accept a logged-in browser session only. A request authenticated by a scoped token is
  rejected, whatever scopes it carries.
- They count as an `own_account` resource (see [`permissions.yaml`](../../permissions.yaml)).
- **Create** takes a name, scopes, an optional list of games and an optional expiry, and returns
  the full token once (see [Tokens](tokens.md)).
- **List** returns metadata only: name, prefix, scopes, games, expiry, last used, created at.
- **Rename** changes the name only. Scopes, games and expiry cannot be edited.
- **Revoke** takes effect at once.

### Staff endpoints

- Staff and superusers can list any user's tokens and revoke them, the same way recovery tokens
  work today (see [`access-control/user.md`](../../access-control/user.md)).
- The list shows metadata only (name, prefix, scopes, games, expiry, last used), never the
  secret.
- They are session-only, like every staff endpoint.

### Validation

- Scopes must come from the catalogue in [Scopes](scopes.md).
- The backend rejects any game the owner cannot reach (as DM, player or PC owner). The filtered
  games picker in the UI is not the only guard.

### Caching

- Every token endpoint has a single private variant and sets `X-Skip-Cache: true`, so the Tent
  proxy never caches it (see [`no-private-cache-routes.md`](../../no-private-cache-routes.md)).
- Token endpoints are not added to the Navi warm-up chain (see
  [`cache-warmer.md`](../../cache-warmer.md)).
- A request carrying `Authorization: Bearer` must never get a cached response that was not
  meant for it. How the proxy and Navi achieve this is an open question below.

## Open questions

Settled by #1596:

- The URL shapes of the owner and staff endpoints (e.g. under the user's account routes, and
  under the staff user page's routes).
- The request and response payloads, including the one-time secret in the create response.
- Error codes and bodies (invalid scope, unreachable game, past expiry, unknown token, token used
  on a session-only endpoint).
- How the PHP Tent proxy treats `Authorization: Bearer` requests: whether it bypasses the cache
  for any request with an `Authorization` header, and whether a proxy rule or middleware change
  is needed.
- Whether Navi needs any change (it should not warm token endpoints, and warm-up requests never
  carry a Bearer token).
- The access-control page for tokens under `docs/agents/access-control/`.

## Affected code

- `backend/accounts/`: owner and staff views, serializers and URLs for tokens.
- [`access-control/user.md`](../../access-control/user.md): the recovery-token endpoints the
  staff endpoints mirror.
- [`access-control.md`](../../access-control.md): a new per-resource page for tokens.
- [`permissions.yaml`](../../permissions.yaml): the `own_account` resource.
- `proxy/` and `docker_volumes/proxy_configuration/`: Tent rules for Bearer requests.
- `navi/`: the warm-up chain, which must not include token endpoints.
