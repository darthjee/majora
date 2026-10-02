# Generalize DeleteHandler and add the staff delete rule
Let `DeleteHandler` serve both routes by deriving the backend URLs from the request path instead of hard-coded character identifiers:

- Accepted paths (anchored regexes):
  - `#^/games/[^/]+/(pcs|npcs)/\d+/photos/\d+\.json$#` (existing)
  - `#^/staff/photos/[a-z0-9_-]+/\d+\.json$#` (new; restrict the `photo_type` segment to a safe slug charset)
- For a matched path `<base>.json`: the deletable URL is `<base>/deletable.json` and the delete URL is the request path itself. Any other path → 400, as today.
- Keep the orchestration unchanged: deletable (non-200 forwarded as-is, no file touched) → `SecurePhotoStorage::deleteFile(path)` (missing = already deleted) → backend `DELETE` → `X-Cache-Clear` cleared on 2xx and stripped.
- No `StaffAccessGuard` call. Authorization is enforced by the backend on both calls.
- Update the class and method docblocks to describe both routes.

Rules: in both `proxy/dev_configuration/rules/delete.php` and `proxy/prod_configuration/rules/delete.php`, add a `DELETE` regex matcher for the staff path to the existing `DeleteHandler` rule (or a sibling rule with the same handler config). `delete.php` is loaded before `backend.php`, so it takes precedence over the generic `default_proxy` `.json` rule. Confirm that with a configuration test if the existing route-ordering tests make that easy.

Tests (`DeleteHandlerTest`):
- Staff path: deletable 200 → file deleted, `DELETE /staff/photos/<type>/<id>.json` forwarded, 204 relayed, `X-Cache-Clear` cleared and stripped.
- Staff path: deletable 401/403/404/422 forwarded, no file deleted, no `DELETE` sent.
- Staff path: file already missing → backend `DELETE` still called.
- Staff path with an invalid type segment (e.g. containing `..` or `/`) → 400.
- All existing character-path tests still pass unchanged.

## Files to Change
- `proxy/extension/lib/handlers/DeleteHandler.php` — path-derived URLs supporting both routes.
- `proxy/dev_configuration/rules/delete.php`, `proxy/prod_configuration/rules/delete.php` — add the staff `DELETE` matcher.
- `proxy/extension/tests/handlers/DeleteHandlerTest.php` — staff-route cases.
- `proxy/extension/tests/configuration/` — optional routing test that staff `DELETE` hits `DeleteHandler`.
- `proxy/extension/lib/middlewares/ResponseCacheClearMiddleware.php` — refresh the docblock example that cites `DELETE /staff/photos/...` as going through `default_proxy`.
