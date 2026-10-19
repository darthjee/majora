# MajoraClient and public exports
- `client/src/MajoraClient.js`: `constructor(options = {})` builds a `Config` from options,
  then an `HttpClient` and a `Paginator`, exposed as read-only `http` and `paginator`
  properties. No resource accessors (`game()`, `games`) yet — #1609 adds them. Must not expose
  the token through any enumerable property beyond the `Config` the HttpClient uses (avoid
  logging it in `toString` / `inspect`).
- `client/src/index.js`: export `MajoraClient` and every error class from `core/errors/`,
  nothing else. Remove `PACKAGE_NAME` / `packageName`.
- `client/package.json`: add `"exports": "./src/index.js"` (keep `main`); no `bin` entry.
- Replace `client/specs/index_spec.js` with a spec asserting the exact public export list, and
  add `client/specs/MajoraClient_spec.js` (construction, config errors surface at construction,
  an end-to-end GET through the injected fetch stub with the Bearer header, and the
  "no error ever contains the token" check across error types).

## Files to Change
- `client/src/MajoraClient.js` — entry point.
- `client/src/index.js` — public surface; placeholder removed.
- `client/package.json` — `exports` field.
- `client/specs/index_spec.js` — rewritten for the export list.
- `client/specs/MajoraClient_spec.js` — specs.
