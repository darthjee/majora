# Menu, docker-compose, README

Wires the hello page into the menu, adds the local test runner compose
service, and documents how to build/test the project.

## Files to Change

- `crawler/navi-extension/config/menu.yml` — new. `entries: [{ route:
  /ext/loot/hello, text: Loot Hello }]` — placeholder menu file per
  `extending-navi.md`'s "A menu entry" section (this route is already
  auto-appended by the SPA even without this file; the explicit entry just
  controls label/position, matching the issue's ask for a "placeholder menu
  file").
- `crawler/navi-extension/docker-compose.yml` — new. One `extension_tests`
  service on `darthjee/navi-hey-test:${NAVI_TAG}` (reading step 01's `.env`
  via compose's automatic `.env` loading), mounting `./src:/work/src:ro` and
  `./tests:/work/tests:ro` — copy `extending-navi.md`'s "Running it"
  `docker-compose.yml` verbatim, substituting the literal tag for
  `${NAVI_TAG}`.
- `crawler/navi-extension/README.md` — new. How to build (`yarn install &&
  yarn build`, producing `dist/frontend/hello.js` + `.css` and
  `dist/backend/hello.js`) and how to test (`yarn test`, i.e. `docker compose
  run --rm extension_tests`, plus `docker compose run --rm extension_tests
  lint` for the lint-only subcommand referenced by the issue's "Done when").
  Cross-reference `docs/agents/external/navi/extending-navi.md` and the
  parent spec `docs/agents/specs/loot-crawling/interactive-collection-enqueue.md`.
