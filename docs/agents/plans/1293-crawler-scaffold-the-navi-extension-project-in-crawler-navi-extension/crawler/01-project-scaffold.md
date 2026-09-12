# Project scaffold (package.json, vite.config.js, NAVI_TAG source)

Create the standalone `crawler/navi-extension/` project shell — package
manifest, Vite library build config, the single-sourced `NAVI_TAG` value, and
the `dist/` gitignore entry. No route/page code yet (steps 02–04).

`crawler/package.json` and `crawler/navi_config*.yaml` are untouched — this
project lives entirely under `crawler/navi-extension/`.

## Files to Change

- `crawler/navi-extension/package.json` — new. `"type": "module"`, `private:
  true`. Dev deps: `vite`, `@vitejs/plugin-react`, `react` (`^19.2.0`),
  `react-dom` (`^19.2.0`), `react-router-dom` (`7.14.2`) — see
  [crawler.md](../crawler.md)'s Notes for how these exact versions were
  confirmed. Scripts:
  - `"build": "vite build && mkdir -p dist/backend && cp src/backend/*.js dist/backend/"`
  - `"test": "docker compose run --rm extension_tests"`
  Mirror `docs/agents/external/navi/extending-navi.md`'s worked-example
  `package.json` for `author`/`license` (`darthjee` / `MIT`, matching repo
  convention).
- `crawler/navi-extension/.env` — new. `NAVI_TAG=1.11.1` (current published
  `darthjee/navi-hey` / `darthjee/navi-hey-test` tag as of plan time —
  re-verify on Docker Hub if this has drifted). This is the single source of
  truth step 04's `docker-compose.yml` reads via variable substitution, and
  the value #1298's `dockerfiles/navi_hey_loot_enqueue/Dockerfile` (`ARG
  NAVI_TAG`) must read from the same file rather than re-declaring.
- `crawler/navi-extension/vite.config.js` — new. `build.lib` with a single
  ESM entry `src/frontend/entry.js`, `formats: ['es']`, `fileName: () =>
  'hello.js'`, `cssFileName: 'hello'`, `outDir: 'dist/frontend'`,
  `emptyOutDir: true`. `rollupOptions.external` = `react`, `react-dom`,
  `react-dom/client`, `react-router-dom`, `react/jsx-runtime`,
  `react/jsx-dev-runtime` — copy verbatim from `extending-navi.md`'s "A
  frontend page" section, only renaming the emitted basename from `orders`
  to `hello`.
- `.gitignore` (repo root) — add `crawler/navi-extension/dist/`.
