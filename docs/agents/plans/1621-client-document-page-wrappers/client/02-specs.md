# Specs

Add `client/specs/resources/DocumentPages_spec.js` and extend `Documents_spec.js`, using the
`specs/support/` fetch stub (`FetchStub`, `buildCore`), following `Documents_spec.js`.

Cover:

- URL building per variant for every action
  (`games/epic-quest/documents/7/pages`, `…/pages/all`, `…/pages/12`, `…/pages/12/all`,
  `…/pages/bump_version`, `…/pages/bump_version/all`), and that `get` (both variants) throws
  `UsageError` before any request.
- HTTP methods and bodies: `trim(3)` sends `DELETE` with JSON `{"keep":3}`; `bumpVersion`
  sends `PATCH` with the given body unchanged; `create` / `update` send `POST` / `PATCH`.
- `list` returns a `Page` with the page options, and `iterate` walks every page.
- Headers (Bearer token, JSON content type) and that errors map per status
  (e.g. 403 → `PermissionError`, 400 → `ValidationError`) without the token in the message.
- No retry for `trim` / `bumpVersion` on a network error (only `GET` retries).
- `documents.pages(7)` returns a `DocumentPages` bound to document 7; blank ids
  (`undefined`, `null`, `''`) throw `UsageError`; ids are URL-encoded.

If `specs/support/variantExamples.js` is extended to handle `trim` / `bumpVersion`, keep its
existing callers working.

## Files to Change

- `client/specs/resources/DocumentPages_spec.js` — new spec.
- `client/specs/resources/Documents_spec.js` — `pages(id)` accessor cases.
- `client/specs/support/variantExamples.js` — optionally, `trim` / `bumpVersion` support.
