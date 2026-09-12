# Crawler Plan: Crawler: Navi extension frontend page - collection Enqueue form

Main plan: [plan.md](plan.md)

## Overview

`crawler/navi-extension/` already has a working scaffold (#1293) with one
example page (`HelloPage.jsx`, route `/ext/loot/hello`) and one working
backend route (#1295's `POST /ext/lootstudios/enqueue.json`,
`crawler/navi-extension/src/backend/enqueue.js`). This plan adds the second
frontend page — `EnqueuePage.jsx` — following the exact same
component/entry/menu/spec pattern the hello page already established, and
wires it to the real enqueue endpoint instead of a placeholder.

## Context

- Route contract (already implemented, do not change):
  `docs/agents/specs/loot-crawling/interactive-collection-enqueue.md`'s
  "Route contract" section, and `crawler/navi-extension/src/backend/enqueue.js`.
  - Request: `POST /ext/lootstudios/enqueue.json`, body
    `{ "url": "https://app.lootstudios.com/bundle/<slug>/" }`.
  - Responses:
    | Case | Status | Body |
    | --- | --- | --- |
    | Accepted | `200` | `{ "status": "enqueued", "slug": "<slug>", "namespace": "enqueue_<slug>_<uuid>" }` |
    | Malformed `url` | `400` | `{ "error": "url must be an https://app.lootstudios.com/bundle/<slug>/ URL" }` |
    | Slug not found | `404` | `{ "error": "collection not found" }` |
    | Resolve/push/start failure | `502` | `{ "error": "<underlying failure message>" }` |
- New route: `/ext/lootstudios/enqueue` (frontend), menu label `Loot Enqueue`
  — deliberately mirrors the backend's `/ext/lootstudios/...` prefix rather
  than the existing hello page's `/ext/loot/...` prefix (see the issue file
  for why).
- The page is **form only** — no polling, no run-status display. A `200`
  response is just "queued", not "done"; render it as a plain confirmation,
  never as a success/failure of the crawl itself.
- Existing pattern to mirror: `HelloPage.jsx` (`useState` + `useEffect` +
  `fetch`), `entry.js` (default-export descriptor array), `config/menu.yml`
  (`route`/`text` entries), `tests/frontend/hello_page_spec.jsx`
  (`useContainer` + `mockFetchSuccess`).

## Steps

- [01 — Add the EnqueuePage component](crawler/01-add-enqueue-page-component.md)
- [02 — Wire the entry.js descriptor](crawler/02-wire-entry-descriptor.md)
- [03 — Add the menu.yml entry](crawler/03-add-menu-entry.md)
- [04 — Add the frontend spec](crawler/04-add-frontend-spec.md)

## Notes

- **`mockFetchFailure`'s exact signature is unconfirmed.** The only
  documentation available (`docs/agents/external/navi/extending-navi.md`'s
  "Testing your extension" table) gives `mockFetchFailure(status)` with no
  documented way to control the mocked response's JSON body — the source of
  `navi-hey/testing/fetch.js` is inside the `darthjee/navi-hey-test` image,
  not available to read locally in this repo. Before writing step 04's spec,
  run `docker compose run --rm extension_tests sh` (or a throwaway spec) to
  inspect the actual helper — if it only sets `status` with an empty/absent
  body, write the error-state assertions against whatever body the double
  actually produces (e.g. a generic fallback message) rather than the
  literal `error` text from the route contract table above, and note the gap
  in the spec file itself. Do not block the whole issue on this — degrade
  the assertion, don't invent an unsupported helper argument.
- `crawler/navi-extension/vite.config.js` bundles `src/frontend/entry.js`
  into one fixed-name `dist/frontend/hello.js` / `hello.css` output — adding
  a second page increases what that one bundle contains but does not
  require any `vite.config.js` change (still one entry point, one output
  pair). The output being named "hello" for a bundle that now also contains
  the Enqueue page is pre-existing and out of scope for this issue.
- No CircleCI job exercises `crawler/navi-extension/` yet (`#1299` adds
  one) — verify locally via `cd crawler/navi-extension && yarn test`
  (`docker compose run --rm extension_tests`) instead of a CI check.
