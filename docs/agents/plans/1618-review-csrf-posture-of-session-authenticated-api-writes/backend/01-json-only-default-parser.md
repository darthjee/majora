# Make JSON the only default parser

Add `'DEFAULT_PARSER_CLASSES': ['rest_framework.parsers.JSONParser']` to `REST_FRAMEWORK` in
`backend/majora_project/settings.py`, with a short comment explaining it closes the same-site
HTML form POST path on session-authenticated writes (#1618). Add
`'TEST_REQUEST_DEFAULT_FORMAT': 'json'` so `APIClient` sends JSON by default.

Add a project-level test proving that a session-authenticated `POST` to a regular write
endpoint (pick an existing one outside the token views, e.g. a game-scoped create) with a
form-encoded body, a multipart body and a `text/plain` body each gets `415`, and that the same
request with a JSON body still succeeds.

Run the full backend suite and fix any test that now fails with `415` by sending JSON.

## Files to Change

- `backend/majora_project/settings.py` — add `DEFAULT_PARSER_CLASSES` and
  `TEST_REQUEST_DEFAULT_FORMAT` to `REST_FRAMEWORK`.
- `backend/majora_project/tests/` (or the nearest existing settings/security test module) — new
  test for the `415` behavior on non-JSON bodies.
- Any existing `*_test.py` that sends non-JSON bodies — switch to JSON.
