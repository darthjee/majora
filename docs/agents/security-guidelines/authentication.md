# Authentication Gaps

- Every non-trivial view must declare `@permission_classes` (DRF) or equivalent. Using `AllowAny` is only acceptable for endpoints that intentionally serve public, unauthenticated data (e.g. public read-only lists).
- **Exception — inline `require_authenticated`/`require_staff` pattern:** views that need to return a custom 401 (unauthenticated) vs. 403 (authenticated but not staff/superuser) body, rather than DRF defaults, may use an inline check pattern — document the reason in a comment.
- Views that omit both `@authentication_classes` and `@permission_classes` inherit the DRF `DEFAULT_AUTHENTICATION_CLASSES` / `DEFAULT_PERMISSION_CLASSES` settings — verify those defaults are reviewed and appropriate for the endpoint.
- Admin views must not be reachable via the API router unless gated by `IsAdminUser` or equivalent.

## Scoped API tokens

Rules for `Authorization: Bearer mjr_...` tokens (`accounts.ApiToken`). The full model is in
[ApiToken](../access-control/api-token.md) and the scope rules in
[Token scopes](../access-control/token-scopes.md).

- `ApiTokenAuthentication` must stay **first** in `DEFAULT_AUTHENTICATION_CLASSES`. A Bearer
  request is always a scoped request: it never falls back to the session or to anonymous, and
  every failure is the same `401` `token_invalid`.
- **Every new API view must declare `@token_scopes`** for each method it serves (above
  `@api_view`), or it refuses tokens with `403` `token_not_allowed`. The coverage test
  (`backend/accounts/tests/token_scopes_coverage_test.py`) fails CI otherwise.
- A declaration must follow the read and write rules in
  [Token scopes](../access-control/token-scopes.md): restricted reads need the `read` scope of
  every family in the response, and a route game-scoped by anything other than the `game_slug`
  kwarg must enforce the token's game list in the view.
- `account/`, `users/`, `staff/` and `admin/` routes are never reachable with a scoped token.
  Token management views additionally call `require_session` first, so a narrow token can never
  mint a wider one.
- The secret is hashed (SHA-256 of the secret part) and never serialized, logged or kept in
  history; the full token appears only in the create response. Staff revocations are logged
  without the secret or the hash.
- The [client library](../client/library.md#configuration-and-transport-security) refuses plain
  HTTP except for `localhost` or an explicit `allowInsecureHttp`, so the token never travels in
  clear text by accident.
