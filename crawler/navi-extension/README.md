# Navi Loot Extension

A standalone [Navi](../../docs/agents/external/HOW_TO_USE_NAVI.md) extension —
one backend route, one frontend page, one menu entry — proving the
backend-route + frontend-page + menu-entry wiring described in
[`docs/agents/external/navi/extending-navi.md`](../../docs/agents/external/navi/extending-navi.md).
It currently only exposes a trivial "hello" example; the real crawl/enqueue
logic comes in follow-up issues (see
[`docs/agents/specs/loot-crawling/interactive-collection-enqueue.md`](../../docs/agents/specs/loot-crawling/interactive-collection-enqueue.md)
for the feature this scaffolds towards).

This project is independent from `crawler/package.json` — it has its own
`package.json`, dependencies, and build/test pipeline, and is never installed
or run as part of the root `crawler/` project.

## Layout

```
navi-extension/
  src/
    backend/hello.js        # GET /ext/loot/hello.json
    frontend/HelloPage.jsx  # renders the hello.json response
    frontend/entry.js       # { path, text, component } descriptor
  tests/
    backend/hello_spec.js
    frontend/hello_page_spec.jsx
  config/menu.yml           # menu entry for the hello page
  docker-compose.yml        # extension_tests service
  vite.config.js
  package.json
  .env                      # NAVI_TAG, single-sourced for the test image tag
```

## Building

```bash
yarn install
yarn build
```

This runs `vite build` (frontend library bundle, React externalised) and
copies `src/backend/*.js` verbatim into `dist/backend/`, producing:

```
dist/
  backend/hello.js
  frontend/hello.js
  frontend/hello.css
```

`dist/` is mounted at `/navi/extensions` by a Navi instance with
`NAVI_EXTENSIONS_ENABLED=true` (see `extending-navi.md`'s "Enabling
extensions" section) — no build step runs against a live Navi container.

## Testing

```bash
yarn test
```

`yarn test` is `docker compose run --rm extension_tests`: it runs this
extension's Jasmine suite (backend and frontend) inside the prebuilt
`darthjee/navi-hey-test:${NAVI_TAG}` image, mounting `src/` and `tests/`
read-only — no local test toolchain, no `yarn install` required for tests.
`${NAVI_TAG}` is read from the checked-in `.env` file in this directory,
which pins the `darthjee/navi-hey` tag this extension deploys `FROM`.

Other subcommands:

```bash
docker compose run --rm extension_tests backend    # backend suite only
docker compose run --rm extension_tests frontend    # frontend suite only
docker compose run --rm extension_tests lint        # eslint over src/ + tests/
docker compose run --rm extension_tests sh          # interactive shell
```

See `extending-navi.md`'s
["Testing your extension"](../../docs/agents/external/navi/extending-navi.md#testing-your-extension)
section for the full test-double reference.
