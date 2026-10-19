# Error hierarchy
Create one class per file in `client/src/core/errors/`, following the spec's Errors section:

- `MajoraError` (extends `Error`, sets `name` to the class name) — base for everything thrown.
- `ConfigurationError`, `UsageError` — local errors.
- `NetworkError` — `fetch` rejected; carries `cause` and a `timeout` boolean.
- `ApiError` — any non-2xx; carries `status`, `method`, `path`, `body`, `codes`. Message format:
  `<status> <ClassName> on <METHOD> <path>: <codes joined by ", ">` (codes part omitted when empty).
  - `ValidationError` (400) with `fields` (the `errors` object).
  - `AuthenticationError` (401).
  - `PermissionError` (403) with `code`: the first of `scope_missing` / `game_not_allowed` /
    `token_not_allowed` found in `codes`, else `null`.
  - `NotFoundError` (404).
  - `ServerError` (5xx).
- A small helper (e.g. `errors/extractCodes.js` or a static on `ApiError`) that flattens codes
  from `errors.<field>[]`, `errors.detail[]`, `detail`, `error` and `reason`, tolerating string
  bodies, `null` and unexpected shapes.
- A factory (e.g. `ApiError.fromResponse({ status, method, path, body })`) that picks the
  subclass by status; other statuses (409, 422, …) give a plain `ApiError`.

Errors never receive request headers or request bodies — only `method`, `path` (without query
string token-free; the path is built by the library) and the parsed response body.

Specs under `client/specs/core/errors/`: subclass and `instanceof` per status, `codes`
extraction for every body shape in the spec's table (400, 401, 403 scope, 403 role/empty, 404
empty and `{"detail": "Not found."}`, 422 upload and link, HTML 502), `fields`, `code`, messages.

## Files to Change
- `client/src/core/errors/MajoraError.js` — base class.
- `client/src/core/errors/ConfigurationError.js`, `UsageError.js`, `NetworkError.js` — local errors.
- `client/src/core/errors/ApiError.js` — API error base, code extraction, factory by status.
- `client/src/core/errors/ValidationError.js`, `AuthenticationError.js`, `PermissionError.js`,
  `NotFoundError.js`, `ServerError.js` — status subclasses.
- `client/specs/core/errors/*_spec.js` — specs for the above.
