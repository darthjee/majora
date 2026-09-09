# Crawler debug HTTP client

Add a thin `BaseClient` subclass for the debug endpoint's `GET` side (this
page never `POST`s — that's the crawler's job, out of scope here).

## Files to Change

- `frontend/assets/js/client/CrawlerClient.js` — new class extending
  `BaseClient` (mirrors `GameSessionClient.js`'s shape). One method:
  `fetchEmissions(lastId, token)` → `this.getJson(`/staff/crawler.json${query}`,
  token)`, where `query` is built via `this.buildQuery([['last_id', lastId]])`
  (omits the param entirely when `lastId` is `undefined`/`null`, matching the
  backend's "from the start" behavior when `last_id` is absent). Returns the
  raw fetch `Response`; the bare-array body is parsed by the controller.
