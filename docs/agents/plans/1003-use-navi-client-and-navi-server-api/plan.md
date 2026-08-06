# Plan: Use navi client and navi server api

Issue: [1003-use-navi-client-and-navi-server-api.md](../issues/1003-use-navi-client-and-navi-server-api.md)

## Overview

Replace the CI cache-warmer's standalone-`navi-hey`-binary approach with driving the already-deployed
persistent Navi server via the `navi-hey-client` CLI. Two agents are involved: `cache` extracts and
namespaces the config files the client will push, and `infra` adds the CI scripts/jobs (a new
non-blocking `wake-navi` job plus a rebuilt client-based `warm-up-cache` job) and the local-dev env
plumbing needed to keep `docker-compose`'s `majora_navi` server working under the same namespacing
scheme.

## Agents involved

- [cache](cache.md)
- [infra](infra.md)

## Shared contracts

- **`NAVI_NAMEPACE` env var** — the namespace every navi config file/request uses. `cache` declares
  it as a top-level `namespace: $NAVI_NAMEPACE` key in every file under `navi/resources/` (the five
  existing domain files plus the new `clients.yml`) — `cache` never sets its value, only references
  it as a placeholder resolved at read time by whoever loads the file. `infra` is responsible for
  actually giving it a value in every environment that loads those files:
  - In CI, `infra`'s `warm-up-cache` job computes `NAVI_NAMEPACE="${MAJORA_NAMESPACE}-${CIRCLE_WORKFLOW_WORKSPACE_ID}"`
    before invoking `navi-client` (`$MAJORA_NAMESPACE` is a manually-configured CircleCI project env
    var; `$CIRCLE_WORKFLOW_WORKSPACE_ID` is CircleCI's built-in per-build-unique id, already used the
    same way in `bin/deploy_frontend.sh`).
  - In local dev, `infra` adds `NAVI_NAMEPACE` to `docker-compose.yml`'s `majora_navi` service
    `environment:` allowlist (forwarded from `.env`), with a `NAVI_NAMEPACE=default` fallback in
    `.env.dev.sample` — matching Navi's own "absent `namespace:` falls back to `default`" convention.

- **Resource file list** — `cache` produces exactly these six files under `navi/resources/`:
  `games.yml`, `npcs.yml`, `pcs.yml`, `permissions.yml`, `treasures.yml`, `clients.yml` (new). `infra`'s
  `scripts/warm_navi_cache.sh` hardcodes this exact list as `--file` arguments to `navi-client -a config`
  (a static list by design, since the CLI doesn't understand `navi_config.yaml`'s `include:` the way the
  `navi-hey` server binary does). If `cache` ever adds/removes a resource file, `infra`'s script's
  `RESOURCE_FILES` array must be updated to match.

- **`navi_config.yaml`'s `include:` list** — `cache` removes the top-level `clients:` block from
  `navi_config.yaml` and adds `resources/clients.yml` to its `include:` list instead. This is what keeps
  `infra`-owned `docker-compose.yml`'s `majora_navi` service (which still runs the standalone
  `navi-hey --config navi_config.yaml` server for local dev) getting client config through the same
  include chain, unchanged from `infra`'s point of view — `infra` does not need to touch
  `navi_config.yaml` itself.

## Notes

- `engine-stop` is out of scope — nothing in this flow calls it.
- This is a pure CI/infra-plumbing change: no new API endpoints, auth logic, or user-facing behavior,
  so no `data-access`/`security`/`product-owner` review is needed.
