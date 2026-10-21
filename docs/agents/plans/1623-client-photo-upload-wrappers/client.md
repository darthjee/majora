# Plan: Client: photo upload wrappers

Issue: [1623-client-photo-upload-wrappers.md](../../issues/1623-client-photo-upload-wrappers.md)

## Overview

Wrap the photo routes of `pcs`, `npcs`, `factions`, `items` and `documents`:

- `uploadPhoto(id, file, options)` on all five: `POST <id>/photo_upload.json` → `{ upload_id, token }`,
  then `POST /uploads/image/<upload_id>/submit` (multipart, field `file`, header
  `X-Upload-Token: <token>`) → `{ file_path }`, which is returned.
- `setMainPhoto(id, photoId, options)` on `pcs`, `npcs`, `documents`:
  `PATCH <id>/photos/<photo_id>/set.json`.
- `deletePhoto(id, photoId, options)` on `pcs`, `npcs`: `DELETE <id>/photos/<photo_id>.json`.

## Context

- `HttpClient#send` always builds `<baseUrl>/<path>.json` (`jsonPath` in
  `src/core/requestHelpers.js`); the submit route has no `.json` (proxy rule
  `#^/uploads/(image|file)/\d+/submit$#`, `docs/agents/architecture/proxy.md` "Photo uploads").
- The backend checks the upload token in `X-Upload-Token` (`backend/uploads/views.py`).
- `encodeBody` already passes a native `FormData` as is; `extractCodes` already reads `reason`, so
  proxy 422s (`{"error": "Unprocessable Entity", "reason": "<code>"}`) map to `ApiError` with
  `codes` without change.
- No photo route has a restricted variant: every new variant entry is `restricted: null`.
- Factions and items have a single photo (replaced in place): no set/delete there. Documents have
  set but no delete. Only characters have delete (proxy `DeleteHandler`).
- Scopes are not checked by the wrapper. Finalize scoping is #1639 (scoped tokens get
  `403 token_not_allowed` on submit until it lands; faction photos raised there).

## Steps

- [01 — Let HttpClient send a path without `.json`](client/01-raw-path-requests.md)
- [02 — Photo wrappers](client/02-photo-wrappers.md)
- [03 — Documentation](client/03-docs.md)

## CI Checks

- `client`: `make client-tests` (CI job: `client_tests`)
- `client`: `make client-lint` (CI job: `client_checks`)
- docs: markdownlint (CI job: `markdownlint`)

## Notes

- The CLI (`src/cli/`) is out of scope: no upload command is added.
- Never log or embed the upload token or the API token in an error; `HttpClient` errors already
  exclude headers and bodies — add a spec asserting it for the submit step.
- The init `POST`, the submit `POST`, `PATCH` and `DELETE` are never retried (existing
  `RetryPolicy`); do not pass `retries`.
