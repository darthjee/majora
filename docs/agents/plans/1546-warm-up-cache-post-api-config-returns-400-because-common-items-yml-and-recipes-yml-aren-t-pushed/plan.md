# Plan: warm-up-cache: POST /api/config returns 400 because common_items.yml and recipes.yml aren't pushed

Issue: [1546-warm-up-cache-post-api-config-returns-400-because-common-items-yml-and-recipes-yml-aren-t-pushed.md](../../issues/1546-warm-up-cache-post-api-config-returns-400-because-common-items-yml-and-recipes-yml-aren-t-pushed.md)

## Overview
Fix `scripts/warm_navi_cache.sh` so the `warm-up-cache` CI job pushes every resource file listed in `navi/navi_config.yaml` (derived, not hardcoded), strips the trailing slash from production URLs, and fails fast on missing required env vars.

See [infra.md](infra.md) for the full plan.
