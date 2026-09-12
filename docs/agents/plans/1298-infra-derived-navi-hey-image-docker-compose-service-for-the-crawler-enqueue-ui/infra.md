# Infra Plan: Infra: derived navi-hey image + docker-compose service for the crawler Enqueue UI

Main plan: [plan.md](plan.md)

## Steps

- [01 — Add the derived Dockerfile](infra/01-add-derived-dockerfile.md)
- [02 — Add the docker-compose service](infra/02-add-compose-service.md)
- [03 — Document the new env vars](infra/03-document-env-vars.md)

## Notes

- `dockerfiles/navi_hey_extension_example/` does **not** exist in this repo — the
  pattern to follow is the "Baking the extension into a derived image" section of
  `docs/agents/external/navi/extending-navi.md`, not a literal file to copy.
- `NAVI_TAG` must equal `crawler/navi-extension/.env`'s `NAVI_TAG` (currently
  `1.11.1`, the same tag `majora_navi`'s `darthjee/navi-hey:1.11.1` image runs in
  `docker-compose.yml`). Single-source it — do not hardcode the version twice.
- `crawler/navi-extension/dist/` must be built (`cd crawler/navi-extension && yarn
  build`) before `docker compose build crawler_navi_web` — it is gitignored and
  not produced by this plan.
- **Verification** (issue's "Done when", after building `dist/` and running
  `docker compose build crawler_navi_web` then `up`):
  - `GET /extensions/frontend.json` lists the Enqueue page.
  - The `#/ext/loot/…` route loads inside the stock layout.
  - The menu entry is present server-side.
  - With `NAVI_EXTENSIONS_ENABLED` unset, the route is absent.
  - End-to-end manual check (needs a real Lootstudios session + bundle URL):
    paste a bundle URL, hit Enqueue, watch one job go queued → running → done
    with no dead-letter, and confirm the `Collection` + `StlModel`s land in
    Majora's miniatures API.
- No CircleCI job builds or runs this image (`grep` over `.circleci/config.yml`
  found nothing docker-compose/dockerfiles-related to this service) — nothing to
  add under `## CI Checks`.
