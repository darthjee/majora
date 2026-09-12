# Issue: Crawler: Navi extension frontend page - collection Enqueue form

## Description

Part of #1291 ("Interactive per-collection Enqueue interface for the
Lootstudios crawler (Navi extension)"). Building on #1292's contract spec
(`docs/agents/specs/loot-crawling/interactive-collection-enqueue.md`),
#1293's project scaffold, and #1295's already-merged backend route, this
issue adds the frontend Enqueue page: a URL input + "Enqueue" button that
fires a real Navi queue job to crawl one Lootstudios collection.

The page is **form only** — no run status, logs, or job list; Navi's stock
Jobs/Logs screens cover monitoring (an explicit non-goal of #1291). The
existing headless whole-catalog run (`crawler/navi_config.yaml`, run via
`npx navi-hey`) stays byte-identical and primary; this is an additive,
local-maintainer-run mode.

Depends on #1292 (contract) and #1295 (backend route, already merged).
Blocks #1299 (extension test suite/CI) and #1300 (docs/spec retirement).

## Solution

- **`crawler/navi-extension/src/frontend/EnqueuePage.jsx`** (+ same-basename
  `.css`) — a URL text input and an "Enqueue" button. On submit, `POST`s
  `{ url }` to **`/ext/lootstudios/enqueue.json`** — #1295's actual,
  already-implemented route (`crawler/navi-extension/src/backend/enqueue.js`).
  This corrects this issue's earlier draft, which named a
  `/ext/loot/collections/enqueue.json` path that was never implemented; the
  real contract lives in `interactive-collection-enqueue.md`'s "Route
  contract". Renders the response per that contract:
  - `200` → a confirmation message showing the returned `slug` and
    `namespace`.
  - `400` / `404` / `502` → the response body's `error` message.
- **`crawler/navi-extension/src/frontend/entry.js`** — extend the existing
  default-export descriptor array with
  `{ path: '/ext/lootstudios/enqueue', text: 'Loot Enqueue', component: EnqueuePage }`.
  This route prefix mirrors #1295's backend route prefix
  (`/ext/lootstudios/enqueue.json`) rather than the existing hello page's
  `/ext/loot/hello` frontend prefix — a deliberate choice for this page,
  not a rename of the hello page.
- **`crawler/navi-extension/config/menu.yml`** — extend with a
  `route: /ext/lootstudios/enqueue` / `text: Loot Enqueue` entry, mirroring
  the existing hello-page entry's convention.
- React / React-Router stay externals (host SPA import map) — never
  bundled, no new dependency.
- **`crawler/navi-extension/tests/frontend/enqueue_page_spec.jsx`** —
  `useContainer` (`navi-hey/testing/dom.js`) +
  `mockFetchSuccess` / `mockFetchFailure` (`navi-hey/testing/fetch.js`).
  Asserts: the input + button render; submit shows the confirmation state
  and the error state; the `entry.js` descriptor's `path` / `text`.

**Done when:** the spec passes; on the derived image (#1298) the page loads
at its `#/ext/…` route inside the stock layout with the menu entry present.
