# Infra Plan: warm-up-cache: POST /api/config returns 400 because common_items.yml and recipes.yml aren't pushed

Main plan: [plan.md](plan.md)

## Overview
The `warm-up-cache` job's `config` step gets HTTP 400 from Navi because `navi/resources/games.yml` references `game_common_items` and `game_recipes`, defined in `common_items.yml` / `recipes.yml`, which the hardcoded `RESOURCE_FILES` array in `scripts/warm_navi_cache.sh` omits (12 files vs. 14 in `navi/navi_config.yaml`'s `include:`). All changes are confined to `scripts/warm_navi_cache.sh`.

## Context
- `navi/navi_config.yaml` has a top-level `include:` block of `  - resources/<name>.yml` entries (paths relative to `navi/`).
- The CI job runs in `darthjee/navi-hey-client:0.2.4`; do not assume `yq` is available — parse with POSIX/bash tools (`sed`/`awk`/`grep`).
- `MAJORA_PRODUCTION_URLS` is comma-separated; each entry becomes `MAJORA_PRODUCTION_URL` (used as `base_url` in `navi/resources/clients.yml`), and the production value ends with `/`.
- `navi/resources/clients.yml` sends `X-Statistics-Skip-Secret: $STATISTICS_SKIP_SECRET`.

## Steps

- [01 — Derive RESOURCE_FILES from navi_config.yaml](infra/01-derive-resource-files.md)
- [02 — Strip trailing slash from production URLs](infra/02-strip-trailing-slash.md)
- [03 — Fail fast on missing env vars](infra/03-fail-fast-on-missing-env.md)

## CI Checks
- `scripts/`: no automated test suite covers this script; run `bash -n scripts/warm_navi_cache.sh` and, if available, `shellcheck scripts/warm_navi_cache.sh` through docker. End-to-end validation is the `warm-up-cache` CircleCI job (`config` → `accepted` per namespace, `engine-start` → non-empty `enqueued`).

## Notes
- The issue file names the `cache` agent as owner, but `.claude/agents/infra.md` lists `scripts/warm_navi_cache.sh` in infra's scope; `navi/` files need no changes, so infra is the single owner.
- Manual follow-up for the repo owner: ensure `STATISTICS_SKIP_SECRET` is set in the CircleCI context used by `warm-up-cache` — step 03 will make the job fail loudly until it is.
- Preserve the existing `LOG_LEVEL=debug` export and the `NAVI_NAMEPACE` spelling (it's referenced as-is by the resource files).
