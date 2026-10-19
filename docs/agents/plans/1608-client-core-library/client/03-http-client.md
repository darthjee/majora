# HttpClient requests and error mapping
Create `client/src/core/HttpClient.js`, built from a `Config`.

- `request(method, path, { query, body, headers?, timeout, retries, signal })` returning
  `{ status, headers, body }` for 2xx; `get` / `post` / `patch` / `delete` helpers.
- URL: `<baseUrl>/<path>.json` (strip a leading `/` from `path`), query parameters added with
  `URLSearchParams`, skipping `undefined` / `null` values.
- Headers: always `Authorization: Bearer <token>` and `Accept: application/json`.
- Bodies: a `FormData` body is passed as-is (no `Content-Type`, `fetch` sets the boundary);
  any other non-undefined body is `JSON.stringify`-ed with `Content-Type: application/json`.
- Responses: read text once; parse JSON when the content type is JSON (or the text parses),
  otherwise keep the raw text; empty body → `null`.
- Non-2xx → `ApiError.fromResponse({ status, method, path, body })` where `path` is the
  request path relative to `baseUrl` (e.g. `/games/x/npcs/all.json`), never including headers.
- A rejected `fetch` → `NetworkError` with `cause`.

Keep retry/timeout hooks as clear seams (step 04 adds them); keep methods under the
complexity limit by splitting URL building, body encoding and response parsing into small
private helpers or a separate module if needed.

Add a reusable fetch stub in `client/specs/support/` (records calls; returns queued `Response`
objects or rejections) and specs in `client/specs/core/HttpClient_spec.js`: URL and query
building, Bearer and Accept headers, JSON vs `FormData` bodies, JSON / non-JSON / empty
responses, mapping of each status to its error class, network rejection.

## Files to Change
- `client/src/core/HttpClient.js` — HTTP layer.
- `client/specs/support/FetchStub.js` — injectable fetch stub (specs helper; make sure the
  Jasmine glob does not pick it up as a spec).
- `client/specs/core/HttpClient_spec.js` — specs.
