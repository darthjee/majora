# Add CrawlerClient summary + clear methods

Extend the existing `CrawlerClient` (currently only `fetchEmissions`) with the
two methods the new card needs, mirroring `StaffCacheClient.fetchSummary` /
`clearCache` exactly:

- `fetchSummary(token)` → `this.getJson('/staff/crawler/summary.json', token)`.
  Returns the `fetch` `Response`; the caller does `response.json()` to get the
  `{ "<type>": <count> }` object.
- `clearEmissions(token)` →
  `this.request('/staff/crawler.json', { method: 'DELETE', headers: this.buildHeaders(token) })`.
  Returns the `fetch` `Response`; the caller checks `response.ok` (status is
  `204`).

Match the surrounding JSDoc style (param/return blocks like `fetchEmissions`).
Do **not** add either path to `assets/js/client/config/skipCache*.js` — the
backend views are `@restricted` and set `X-Skip-Cache` themselves, consistent
with `/staff/cache/summary.json` being absent from those configs.

In `CrawlerClientSpec.js`, add coverage mirroring the `StaffCacheClient` specs:

- `fetchSummary` calls `getJson` with `'/staff/crawler/summary.json'` and the
  token, and returns its result.
- `clearEmissions` calls `request` with `'/staff/crawler.json'`, method
  `DELETE`, and headers from `buildHeaders(token)`, and returns its result.

## Files to Change

- `frontend/assets/js/client/CrawlerClient.js` — add `fetchSummary` and
  `clearEmissions` methods.
- `frontend/specs/assets/js/client/CrawlerClientSpec.js` — add specs for both
  new methods.
