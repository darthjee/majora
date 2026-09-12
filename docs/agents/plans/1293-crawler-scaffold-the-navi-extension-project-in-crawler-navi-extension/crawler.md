# Crawler Plan: Crawler: scaffold the Navi extension project in crawler/navi-extension/

Main plan: [plan.md](plan.md)

## Steps

- [01 — Project scaffold (package.json, vite.config.js, NAVI_TAG source)](crawler/01-project-scaffold.md)
- [02 — Backend hello route](crawler/02-backend-hello-route.md)
- [03 — Frontend hello page](crawler/03-frontend-hello-page.md)
- [04 — Menu, docker-compose, README](crawler/04-menu-compose-readme.md)

## Notes

- No real crawler/enqueue logic in this issue — the hello route/page only
  prove the extension is loaded, built, and testable. #1294/#1295/#1296 build
  the actual Enqueue feature on top of this scaffold.
- `darthjee/navi-hey-test` currently publishes tag `1.11.1` (and `latest`,
  which points at the same build) — confirmed on Docker Hub at plan time.
  Re-check before pinning if this plan is executed much later.
- `react`/`react-dom` `^19.2.0` and `react-router-dom` `7.14.2` were confirmed
  by reading `/Users/darthjee/projetos/orca/navi/frontend/package.json`
  directly (repo HEAD `6303b20e`, 2026-09-08) — matches
  `extending-navi.md`'s worked-example pin verbatim. A cross-repo question
  was also filed at `~/messages/majora-navi.md` in case Navi has an
  in-flight version bump; re-check that file for a reply before starting
  implementation if much time has passed.
- No `## CI Checks` section: this repo's `.circleci/config.yml` has no
  crawler job yet (added by #1299, which also wires the
  `crawler_extension_tests` job this project's own `docker compose run --rm
  extension_tests` maps to).
