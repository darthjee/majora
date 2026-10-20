# CSRF

- Django REST Framework views using `SessionAuthentication` are subject to CSRF enforcement. Do not use `@csrf_exempt` without confirming the endpoint uses a non-session authentication scheme (e.g. token/cookie separation).
- Views that bypass CSRF via `@csrf_exempt` must include a comment explaining why it is safe to do so.
- Verify that the `CsrfViewMiddleware` is present in `MIDDLEWARE` in `settings.py`; do not remove it.
- Session-authenticated API writes (`CookieTokenAuthentication`) do not use CSRF tokens; it
  never calls `enforce_csrf`, and `@api_view` views are CSRF-exempt. They are protected by:
  - `SESSION_COOKIE_SAMESITE = 'Lax'` — cross-site requests do not carry the session cookie.
  - CORS without credentials — preflighted cross-origin requests cannot ride the session.
    Never enable `CORS_ALLOW_CREDENTIALS` while `CORS_ALLOW_ALL_ORIGINS` is set.
  - JSON-only request bodies project-wide — `REST_FRAMEWORK['DEFAULT_PARSER_CLASSES']` holds
    only `JSONParser` (#1618), so a same-site HTML form POST (form-encoded, multipart or
    `text/plain`, none of which needs a preflight) gets `415`.
- As far as known, no same-site origin other than Majora is served; the JSON-only rule is
  defense in depth against one appearing.
- Never add `FormParser`, `MultiPartParser` or any other non-JSON parser to a
  session-authenticated endpoint (via `@parser_classes` or the settings) without documenting
  why here. File uploads go through the PHP proxy, not Django; Django only receives JSON (e.g.
  the upload finalize `PATCH`).
- Bearer (scoped token) requests carry no cookie-based credential the browser adds on its own,
  so CSRF does not apply to them.
