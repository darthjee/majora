# Plan: Split navi config

Issue: [937-split-navi-config.md](../issues/937-split-navi-config.md)

## Overview
Move the Navi cache-warmer configuration out of `.circleci/navi_config.yaml` into a new top-level `navi/` directory, and split its `resources` section into five domain files under `navi/resources/` (treasures, games, pcs, npcs, permissions) pulled in via Navi's `include` feature. This is a pure file-organization refactor — no functional/behavioral change to the warmed-up endpoints. The `cache` agent owns the config move/split itself; the `infra` agent updates the two places that reference the old path (`docker-compose.yml`, `.circleci/config.yml`).

## Agents involved

- [cache](cache.md)
- [infra](infra.md)

## Shared contracts

- New entry config file path: **`navi/navi_config.yaml`** (top-level directory, sibling to `.circleci/`, created by `cache`).
- New resources directory: **`navi/resources/`** (created by `cache`), containing `treasures.yml`, `games.yml`, `pcs.yml`, `npcs.yml`, `permissions.yml` — pulled into the entry file via a top-level `include:` list, e.g.:
  ```yaml
  include:
    - resources/treasures.yml
    - resources/games.yml
    - resources/pcs.yml
    - resources/npcs.yml
    - resources/permissions.yml
  ```
- None of the split files declare a `namespace:` key — everything stays in the implicit `default` namespace, so cross-resource references (e.g. `games.yml`'s actions pointing at resources defined in `pcs.yml`/`npcs.yml`) need no changes.
- `web`, `workers`, `failure`, and `clients` sections stay in `navi/navi_config.yaml` (the entry file) unchanged — only the entry file is consulted for `web`/`workers`/`failure`.
- `infra` depends on `cache` having created `navi/navi_config.yaml` at that exact path — `infra`'s docker-compose/CircleCI changes just repoint existing commands/mounts, they don't need the file's internal content.
