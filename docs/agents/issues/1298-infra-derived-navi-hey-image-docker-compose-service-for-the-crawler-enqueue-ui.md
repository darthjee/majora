# Issue: Infra: derived navi-hey image + docker-compose service for the crawler Enqueue UI

## Description
Part of #1291 (parent: interactive per-collection Enqueue interface for the Lootstudios crawler). The Navi extension itself — backend enqueue route, frontend Enqueue page, web-enabled entry config — is already built and merged (#1293–#1296). It currently only runs bind-mounted into the stock `darthjee/navi-hey` dev image; there is no packaged, `docker compose up`-able way to run it. This issue bakes the extension into a dedicated derived image and wires up the local-only docker-compose service a maintainer uses to actually run the Enqueue UI.

**No deploy** — this image is built and run locally by a maintainer only; CI does not build or publish it.

## Problem
Navi extensions load from `NAVI_EXTENSIONS_DIR` at process start and are fixed for the container's lifetime (`docs/agents/external/navi/extending-navi.md`), so there is currently no docker-compose service that boots `darthjee/navi-hey` with this extension's built `dist/`, its menu, and `crawler/navi_config.web.yaml` baked in. A maintainer who wants to use the Enqueue UI has no `docker compose up` entry point today — only a manual bind-mount against the dev image.

## Expected Behavior
`docker compose build crawler_navi_web` then `up`:
- `GET /extensions/frontend.json` lists the Enqueue page.
- The `#/ext/loot/…` route loads inside the stock layout.
- The menu entry is present server-side.
- With `NAVI_EXTENSIONS_ENABLED` unset, the route is absent.

Plus the end-to-end manual check from #1291 (now that #1297 landed): paste a real Lootstudios bundle URL, hit Enqueue, watch one job go queued → running → done with no dead-letter, and confirm the `Collection` + `StlModel`s land in Majora's miniatures API.

## Solution
- **`dockerfiles/navi_hey_loot_enqueue/Dockerfile`** (new). Follow the "Baking the extension into a derived image" pattern in `docs/agents/external/navi/extending-navi.md` — this repo has no `dockerfiles/navi_hey_extension_example/` directory; that path in the doc is illustrative, not a file actually present here:
  - `ARG NAVI_TAG` pinned to an **exact** `darthjee/navi-hey` version; `FROM darthjee/navi-hey:${NAVI_TAG}`.
  - `COPY crawler/navi-extension/dist/ /navi/extensions/`
  - `COPY crawler/navi-extension/config/menu.yml /home/node/app/config/menu.yml`
  - `COPY crawler/navi_config.web.yaml crawler/navi_config.yaml /home/node/app/config/`
  - `ENV NAVI_EXTENSIONS_ENABLED=true`
  - Entrypoint runs `navi-hey --config .../navi_config.web.yaml`.
  - Build context = repo root; building requires `crawler/navi-extension/dist/` to exist first (`cd crawler/navi-extension && yarn build`) — document this.
- **`docker-compose.yml`** — a new local-only service (e.g. `crawler_navi_web`) that builds the Dockerfile, maps a host port bound to `127.0.0.1` (the extension route is unauthenticated by design — see #1291's "Cross-cutting concerns"), and passes:
  - `MAJORA_API_TOKEN`, `MAJORA_API_BASE_URL`, `LOOTSTUDIOS_SESSION_COOKIE` — already consumed by `crawler/navi_config.yaml`, but never wired into any compose service before this.
  - `NAVI_API_TOKEN` — backs `navi_config.web.yaml`'s `web.api.token: $NAVI_API_TOKEN`.
- **`.env.dev.sample`** — document all four vars above (none of them are currently present in this file).

**Version pin:** `NAVI_TAG` here MUST equal `crawler/navi-extension/.env`'s `NAVI_TAG` (currently `1.11.1` — the same tag `majora_navi`'s own `darthjee/navi-hey:1.11.1` image runs). Single-source the value rather than hardcoding it twice. Run `extending-navi.md`'s "Upgrading the base image" checklist on any future bump.

**Files**: `dockerfiles/navi_hey_loot_enqueue/Dockerfile` (new), `docker-compose.yml`, `.env.dev.sample`.

Owner: **infra**. Depends on #1293, #1294, #1295, #1296 (extension scaffold, web config, backend route, frontend page — all closed). Blocks #1300's runbook.

## Benefits
Gives a maintainer an actual local entry point (`docker compose up crawler_navi_web`) to run the interactive Enqueue UI end-to-end, completing the packaging half of #1291 so the feature is usable outside of a bind-mounted dev checkout.
