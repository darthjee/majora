# ApiToken (Scoped API Tokens)

**[Account resource](principles.md#resource-categories) on the owner side, and
[staff resource](principles.md#resource-categories) on the staff side.** Scoped API tokens
(`accounts.ApiToken`) let automation call the API as their owner. This page states only who may
manage them; the scope rules live in [Scopes](../specs/client/scopes.md) and the token format in
[Tokens](../specs/client/tokens.md). Full endpoint design:
[Token API](../specs/client/token-api.md).

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
  `games` (`[{slug, name}]`, `[]` meaning every [reachable game](../specs/client/token-api.md#reachable-game)),
  `expires_at` (`null` for never), `last_used_at`, `created_at`, `status`
  (`active`/`expired`).
- The secret and its hash are never serialized. The full `token` appears only in the create
  response, once.
- **Create** accepts `name`, `scopes`, `games` and `expires_at` only; the owner is always the
  caller. **Rename** accepts `name` only. Any other field gives `400` `not_editable`, keyed by
  the field. Nothing lets a caller widen a token's scopes or games after creation.
- **Options** returns the scope catalogue, the caller's reachable games and `all_games`
  (`true` for superusers).

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
- Any game delete endpoint added later must revoke (delete) every token whose game list contains
  that game, in the same transaction, rather than letting the list shrink to `[]`.
