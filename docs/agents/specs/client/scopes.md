# Scopes

What a scoped token is allowed to do, and how every endpoint enforces it. Part of the
[client spec](../client.md) (epic #1592). Refined by #1595 and implemented by #1603.

## Overview

A scoped token never grants anything on its own. It only narrows what its owner can already do.
Each token carries a set of resource × action scopes and, optionally, a list of games. Every
endpoint must know which scope it needs, and any endpoint that does not declare one rejects
scoped tokens.

## Decisions

### Intersection with the owner's roles

A request made with a scoped token succeeds only if **both**:

- the owner's existing role rules allow it (admin, dm, owner, player, staff; see
  [`access-control.md`](../../access-control.md) and
  [`permissions.yaml`](../../permissions.yaml)); and
- the token carries the scope the endpoint needs.

A token never grants more than its owner has. The owner's role still picks the endpoint variant
(regular or restricted), as it does today; tokens add no separate regular/restricted dimension.

### Resource × action scopes

- Each scope is one resource family plus one action, written `<resource>:<action>`, for example
  `characters:read`, `characters:write`, `factions:read` or `game_documents:write`.
- The actions are `read`, `write` and `delete`.
- The full catalogue is listed in this page once #1595 settles it.

### Per-game restriction

- A token can carry a list of games.
- When the list is set, game-scoped requests for any other game are denied.
- When the list is empty, the token covers every game the owner can reach.
- Requests that are not game-scoped are governed by scopes alone.

### Never reachable with a scoped token

Whatever scopes it carries, a scoped token can never reach:

- **token management**: creating, listing, renaming or revoking tokens is session-only (see
  [Token API](token-api.md));
- **account data**: profile, password, email, login and logout;
- **staff endpoints**: cache, copy, crawler, photo and statistics. This epic defines no staff
  scopes.

### Uploads

Upload flows are not excluded. An upload follows the scope of the resource it attaches to: for
example, uploading a character photo needs the character `write` scope.

### Fail closed

Enforcement must fail closed: an endpoint that declares no scope rejects every scoped token.
Adding a new endpoint therefore never silently opens it to tokens.

### Enforcement candidates

The enforcement mechanism is chosen after surveying the existing views. Two candidates:

- **Per-view declaration.** Each view declares its resource family, and a DRF permission class
  maps the HTTP method to an action (`GET` to `read`, `POST`/`PUT`/`PATCH` to `write`, `DELETE`
  to `delete`).
- **Central URL map.** A single map from URL pattern to required scope.

## Open questions

Settled by #1595:

- The survey of the existing views and URL patterns, grouped into resource families.
- The full scope catalogue: every resource family and which actions apply to each.
- The enforcement mechanism: per-view declaration or a central URL map, and how it fails closed.
- How the per-game restriction finds the game of a request (URL slug, object lookup, or both).
- Which status code and body a request gets when the token lacks a scope or a game.
- How scopes are stored on `ApiToken` (see [Tokens](tokens.md)) and validated on creation.

## Affected code

- `backend/*/views*.py`: every API view, which must declare (or be mapped to) its scope.
- `backend/accounts/authentication.py`: the Bearer authentication class exposes the token, so
  permission checks can read its scopes and games.
- [`permissions.yaml`](../../permissions.yaml) and
  [`access-control/`](../../access-control.md): the owner role rules that scopes intersect with.
- Staff and account views: must reject scoped tokens outright.
