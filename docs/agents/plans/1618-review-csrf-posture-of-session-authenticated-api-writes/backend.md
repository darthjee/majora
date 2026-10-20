# Backend Plan: Review CSRF posture of session-authenticated API writes

Main plan: [plan.md](plan.md)

## Overview

Set `JSONParser` as the only default DRF parser, drop the per-view JSON-only decorators that
become redundant, prove with tests that form-encoded, multipart and `text/plain` bodies get
`415`, and record the posture in the CSRF security guideline.

## Context

- `CookieTokenAuthentication` falls back to the session and never calls `enforce_csrf`;
  `@api_view` views are CSRF-exempt. Cross-site writes are stopped by
  `SESSION_COOKIE_SAMESITE = 'Lax'` and CORS without credentials, but a same-site origin can
  still send a preflight-free HTML form POST, which DRF parses by default.
- No Django view needs multipart: file bytes go to the PHP proxy, and Django only receives JSON
  (e.g. `upload_finalize` is a JSON `PATCH`). No `request.FILES`, `FormParser` or
  `MultiPartParser` usage exists in `backend/`.
- The scoped API token views already restrict themselves to `JSONParser` as a local fix
  (#1596 / #1604).
- Decided with the user: JSON-only parsers project-wide; remove the per-view decorators; no
  CSRF-token enforcement and no header-only writes. As far as known, no other same-site origin is
  served, so this is defense in depth.

## Steps

- [01 — Make JSON the only default parser](backend/01-json-only-default-parser.md)
- [02 — Remove the per-view JSON-only decorators](backend/02-remove-per-view-parser-decorators.md)
- [03 — Document the CSRF posture](backend/03-document-csrf-posture.md)

## CI Checks

- `backend`: `poetry run pytest` inside the tests container (`make tests`, then run it there)
  (CI jobs: `pytest_all`, `pytest_views_characters`, `pytest_views_rest`)
- `backend`: lint checks (CI job: `checks`)
- `docs`: markdown lint (CI job: `markdownlint`)

## Notes

- DRF's `APIClient` and Django's test `Client` default to **multipart** bodies. Once JSON is the
  only parser, every test that posts/patches/puts data without `format='json'` (or
  `content_type='application/json'`) gets `415`. Set
  `'TEST_REQUEST_DEFAULT_FORMAT': 'json'` in `REST_FRAMEWORK` to fix `APIClient` calls in one
  place; any remaining failures (plain Django `Client`, raw bodies) must be fixed per test by
  sending JSON — never by re-adding a non-JSON parser.
- Requests with no body (e.g. body-less `POST`/`DELETE`) are unaffected: DRF only parses when
  `request.data` is read and a body with a content type is present.
- Django admin is not a DRF view and keeps its own CSRF protection; it is unaffected.
- The frontend and the `client/` package already send JSON (`BaseClient#writeJson`), and
  multipart uploads go to the proxy, not Django — no frontend change is expected. Verify by
  grepping for `FormData`/`URLSearchParams` bodies sent to Django routes.
