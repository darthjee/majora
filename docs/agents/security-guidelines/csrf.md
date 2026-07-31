# CSRF

- Django REST Framework views using `SessionAuthentication` are subject to CSRF enforcement. Do not use `@csrf_exempt` without confirming the endpoint uses a non-session authentication scheme (e.g. token/cookie separation).
- Views that bypass CSRF via `@csrf_exempt` must include a comment explaining why it is safe to do so.
- Verify that the `CsrfViewMiddleware` is present in `MIDDLEWARE` in `settings.py`; do not remove it.
