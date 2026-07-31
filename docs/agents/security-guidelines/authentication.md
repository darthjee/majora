# Authentication Gaps

- Every non-trivial view must declare `@permission_classes` (DRF) or equivalent. Using `AllowAny` is only acceptable for endpoints that intentionally serve public, unauthenticated data (e.g. public read-only lists).
- **Exception — inline `require_authenticated`/`require_staff` pattern:** views that need to return a custom 401 (unauthenticated) vs. 403 (authenticated but not staff/superuser) body, rather than DRF defaults, may use an inline check pattern — document the reason in a comment.
- Views that omit both `@authentication_classes` and `@permission_classes` inherit the DRF `DEFAULT_AUTHENTICATION_CLASSES` / `DEFAULT_PERMISSION_CLASSES` settings — verify those defaults are reviewed and appropriate for the endpoint.
- Admin views must not be reachable via the API router unless gated by `IsAdminUser` or equivalent.
