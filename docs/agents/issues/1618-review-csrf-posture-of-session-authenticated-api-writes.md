# Issue: Review CSRF posture of session-authenticated API writes

## Description

Raised while refining #1596 (the scoped-token management endpoints).

Session-authenticated API writes have no CSRF-token check:

- `CookieTokenAuthentication` (`backend/accounts/authentication.py`) authenticates from the
  session but never calls DRF's `enforce_csrf`.
- `@api_view` views are CSRF-exempt, so `CsrfViewMiddleware` does not protect them.

What protects them today:

- `SESSION_COOKIE_SAMESITE = 'Lax'`: cross-site POST, PATCH and DELETE requests arrive without
  the session.
- CORS without credentials (`CORS_ALLOW_ALL_ORIGINS = True`, credentials not allowed): a
  preflighted cross-origin request never carries cookies.

Relevant facts about the current code:

- No Django view parses multipart or form bodies: file bytes go to the PHP proxy
  (`/uploads/<type>/<id>/submit`), and Django only sees JSON (`upload_finalize` is a JSON
  `PATCH`). No `request.FILES`, `MultiPartParser` or `FormParser` usage exists in `backend/`.
- The SPA already sends `Authorization: Token <token>` on its authenticated requests
  (`BaseClient#buildHeaders`); the session fallback is only how the token is re-hydrated after a
  page refresh.
- The scoped API token views (`accounts/views/api_tokens/*`, `staff/views/staff_user_api_token*`)
  already set `@parser_classes([JSONParser])` as a local fix (#1596 / #1604).

## Problem

A **same-site** origin, such as a sibling subdomain of the same registrable domain (or one hit by
XSS), still gets the session cookie. It can send a plain HTML form POST with a form-encoded,
multipart or `text/plain` body, which needs no preflight and which DRF parses by default
(`JSONParser`, `FormParser`, `MultiPartParser`), to any session-authenticated POST endpoint.
PATCH and DELETE cannot be sent by a form and always need a preflight, so they are not exposed.

## Expected Behavior

- The REST API accepts only JSON request bodies project-wide. A form-encoded, multipart or
  `text/plain` body to any DRF endpoint gets `415 Unsupported Media Type`, so a same-site HTML
  form POST can no longer perform a session-authenticated write.
- The project's CSRF posture for session-authenticated API writes is documented.

## Solution

Decided approach: **JSON-only parsers project-wide**.

- Set `'DEFAULT_PARSER_CLASSES': ['rest_framework.parsers.JSONParser']` in `REST_FRAMEWORK`
  (`backend/majora_project/settings.py`). No endpoint needs multipart today (file bytes go to the
  PHP proxy), so no exceptions are expected.
- Remove the now-redundant `@parser_classes([JSONParser])` decorators (and their imports) from
  `accounts/views/api_tokens/{options,list_create,detail}.py`,
  `staff/views/staff_user_api_token_delete.py` and `staff/views/staff_user_api_tokens.py`. Keep
  (or move to a project-wide test) the existing coverage that a form-encoded body gets `415`.
- Add a test proving a form-encoded POST to a regular session-authenticated endpoint gets `415`.
- Update `docs/agents/security-guidelines/csrf.md`: replace the "reviewed in #1618" note with the
  decided posture — JSON-only bodies project-wide, SameSite=Lax session cookie, CORS without
  credentials; any future endpoint needing a non-JSON parser must justify it there. Record that,
  as far as known, no same-site origin other than Majora is served, so this is defense in depth.

Out of scope (considered and rejected): enforcing CSRF tokens (needs SPA changes), and
restricting the session fallback to safe methods.

## Benefits

- Closes the last browser-driven CSRF path on session-authenticated writes.
- Replaces per-view local fixes with one project-wide, documented rule.
