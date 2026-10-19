# Page and Paginator
Create `client/src/core/Page.js` and `client/src/core/Paginator.js` per the spec's Pagination
section and `docs/agents/pagination.md` (`page` / `per_page` query params; `page` / `pages` /
`per_page` / `total` response headers).

- `Page`: `data` (array), `page`, `pages`, `perPage`, `total` (integers from headers), `hasNext`
  (`page < pages`), `next()` → the next `Page` via the paginator, or `null` on the last page.
  When the headers are missing: `page = pages = 1`, `total = data.length`, `perPage = data.length`
  (or `null`; pick one and spec it).
- `Paginator` (built on `HttpClient`):
  - `list(path, { page, perPage, query, timeout, retries, signal })` → `Page`. Sends `page` and
    `per_page` only when given (no client default); `query` entries are merged first so the
    library's `page` / `per_page` always win and cannot be overridden by filters.
  - `iterate(path, sameOptions)` → async generator over **items**, fetching one page at a time
    (each fetch goes through `HttpClient.get`, so retried independently), stopping at `pages`
    or on an empty page.

Specs: header parsing, missing headers, `hasNext` / `next()` on middle and last pages,
`iterate` across 3 pages fetching lazily (assert call count when breaking early), `perPage`
pass-through and omission, query merging and collision, a retried page in the middle of an
iteration does not refetch earlier pages.

## Files to Change
- `client/src/core/Page.js` — one page of results.
- `client/src/core/Paginator.js` — `list` and `iterate`.
- `client/specs/core/Page_spec.js`, `client/specs/core/Paginator_spec.js` — specs.
