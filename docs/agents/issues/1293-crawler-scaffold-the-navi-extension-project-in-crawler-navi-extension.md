# Issue: Crawler: scaffold the Navi extension project in crawler/navi-extension/

## Description

Part of #1291 ("Interactive per-collection Enqueue interface for the
Lootstudios crawler"). Building on the contract resolved in #1292's spec
(`docs/agents/specs/loot-crawling/interactive-collection-enqueue.md`), this
issue stands up the **empty Navi extension project** at
`crawler/navi-extension/`, per
`docs/agents/external/navi/extending-navi.md`. It proves the backend-route +
frontend-page + menu-entry wiring end to end with a trivial "hello" example —
no crawler/enqueue logic yet, that comes in #1294 (web-enabled Navi config),
#1295 (extension backend enqueue route), and #1296 (extension frontend
Enqueue page). This scaffold also unblocks #1299 (extension test suite +
CircleCI job).

`crawler/navi-extension/` is a standalone Node/Yarn project with its own
`package.json`. `crawler/package.json` and `crawler/navi_config*.yaml` are
untouched and stay at `crawler/` root.

## Solution

Create `crawler/navi-extension/`:

- **`package.json`** — `type: module`, Yarn (repo convention). Dev deps:
  `vite`, `@vitejs/plugin-react`, and `react` / `react-dom` /
  `react-router-dom` pinned to `^19.2.0` / `7.14.2` (React 19, matching
  Majora's own `frontend/package.json`; React-Router 7, matching the Navi
  host SPA's own majors per `extending-navi.md`'s worked example — Majora's
  frontend has no `react-router-dom` dependency of its own to mirror).
  Scripts: `build` = `vite build` then copy `src/backend/*.js` →
  `dist/backend/`; `test` = `docker compose run --rm extension_tests`.
- **`vite.config.js`** — `build.lib` with a single ESM entry
  (`src/frontend/entry.js`), `fileName`/`cssFileName` pinned to the same
  basename, `outDir: dist/frontend`, `rollupOptions.external` = `react`,
  `react-dom`, `react-dom/client`, `react-router-dom`, `react/jsx-runtime`,
  `react/jsx-dev-runtime` — never bundle React, matching
  `extending-navi.md`'s worked example.
- **`src/backend/hello.js`** — one `GET` route (`RequestHandler` subclass
  from `navi-hey/extension`) returning trivial JSON.
- **`src/frontend/HelloPage.jsx`** + **`src/frontend/entry.js`** — one page
  rendering that JSON, with its `{ path, text, component }` descriptor.
- **`tests/backend/`, `tests/frontend/`** — one Jasmine spec each, runnable
  via `docker compose run --rm extension_tests` against
  `darthjee/navi-hey-test`.
- **`config/menu.yml`** — placeholder menu file with an entry for the hello
  page.
- **`docker-compose.yml`** — an `extension_tests` service on
  `darthjee/navi-hey-test:<NAVI_TAG>` mounting `./src` and `./tests`
  read-only (mirrors `extending-navi.md`'s example).
- **`README.md`** — how to build and test.
- **`.gitignore`** — add `crawler/navi-extension/dist/`.

**NAVI_TAG single-sourcing.** The `darthjee/navi-hey-test` tag here must
equal the `NAVI_TAG` #1298 pins its derived image to
(`dockerfiles/navi_hey_loot_enqueue/Dockerfile`, a different directory, so a
compose `x-` anchor can't span both). Single source: a checked-in
`crawler/navi-extension/.env` holding `NAVI_TAG=1.11.1` (the current
published `darthjee/navi-hey` / `darthjee/navi-hey-test` tag), read by this
issue's `docker-compose.yml` via variable substitution; #1298 points its
`Dockerfile`'s `ARG NAVI_TAG` build-arg at the same file instead of
re-declaring the value.
