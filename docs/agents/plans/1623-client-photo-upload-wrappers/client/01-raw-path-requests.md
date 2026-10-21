# Let HttpClient send a path without `.json`

The submit step targets `<baseUrl>/uploads/image/<upload_id>/submit`, but `HttpClient#send`
always appends `.json`. Add a request option (e.g. `json: false`, default `true`) that makes
`#send` build `/<path>` instead of `jsonPath(path)`; everything else (headers, auth, timeout,
error mapping, the path used in error messages) stays the same. Document it in the JSDoc of
`request` and the class comment.

Specs: a `POST` with `json: false` hits the URL with no `.json` suffix; the default still appends
it; query parameters still apply.

## Files to Change

- `client/src/core/HttpClient.js` — new option, used in `#send`.
- `client/src/core/requestHelpers.js` — a helper for the suffix-less path, if cleaner than inline.
- `client/specs/core/HttpClient_spec.js` — coverage for the option.
