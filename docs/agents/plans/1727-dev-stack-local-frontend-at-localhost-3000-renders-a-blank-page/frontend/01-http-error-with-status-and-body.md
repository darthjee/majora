# Keep the HTTP status and body on rejected requests

`parseJsonOrReject` (`frontend/assets/js/utils/http/parseJsonOrReject.js`) rejects with a plain
`new Error(message)`, which loses the status and the body. The games list can't tell
`domain_not_recognized` apart from any other failure.

Add a small `HttpResponseError extends Error` (e.g. `utils/http/HttpResponseError.js`) carrying
`status` and `body` (the parsed JSON body, or `null` when the body isn't JSON). Make
`parseJsonOrReject` reject with it, keeping the same `message`. Add an
`errorCodes()`/`hasErrorCode(code)` helper reading `body.errors.detail` (an array of strings).
It stays an `Error` with the same message, so existing consumers keep working.

## Files to Change

- `frontend/assets/js/utils/http/HttpResponseError.js`: new class.
- `frontend/assets/js/utils/http/parseJsonOrReject.js`: reject with `HttpResponseError`, after
  trying `response.json()` (catching parse failures → `body: null`).
- Matching Jasmine specs: an OK response resolves its JSON; a 404 with a JSON body rejects with
  the status, body and message; a non-JSON body gives `body: null`; `hasErrorCode`.
