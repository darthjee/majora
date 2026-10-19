# CSRF

- Django REST Framework views using `SessionAuthentication` are subject to CSRF enforcement. Do not use `@csrf_exempt` without confirming the endpoint uses a non-session authentication scheme (e.g. token/cookie separation).
- Views that bypass CSRF via `@csrf_exempt` must include a comment explaining why it is safe to do so.
- Verify that the `CsrfViewMiddleware` is present in `MIDDLEWARE` in `settings.py`; do not remove it.
- Session-authenticated API views (`CookieTokenAuthentication`) never call `enforce_csrf`;
  cross-site writes are stopped by `SESSION_COOKIE_SAMESITE = 'Lax'` and by CORS without
  credentials. The project-wide posture is reviewed in #1618.
- The remaining path is a same-site origin posting a plain HTML form. Sensitive endpoints
  should accept JSON only: the scoped API token views set `@parser_classes([JSONParser])`, so a
  form-encoded body gets `415`.
- Bearer (scoped token) requests carry no cookie-based credential the browser adds on its own,
  so CSRF does not apply to them.

