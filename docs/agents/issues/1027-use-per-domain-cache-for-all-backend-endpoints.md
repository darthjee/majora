# Issue: Use per domain cache for all backend endpoints

## Description

As a pilot, per-domain caching (via `DomainHash`) was added for `/games.json` in `proxy/prod_configuration/rules/games.php`. It's worked well, so the same per-domain caching approach should now be applied to all backend `.json` endpoints handled by `proxy/prod_configuration/rules/backend.php`, and the now-redundant `games.php` special case retired.

## Problem

`backend.php` currently caches all `.json` endpoints (except `/games.json`, carved out into `games.php`) in one flat, shared `$cacheFolder`, not partitioned by domain. Meanwhile, the deploy-time cache warmup (`warm-up-cache` CircleCI job / `scripts/warm_navi_cache.sh`) only knows how to warm a single domain (`$MAJORA_PRODUCTION_URL`) — once caching is domain-partitioned across all endpoints, warmup would only ever refill one domain's cache after each deploy, leaving every other domain cold.

## Expected Behavior

- Every backend `.json` endpoint (any method, same coverage `backend.php`'s `.json`-`ends_with` matcher already has) gets its cache partitioned per domain, exactly like `/games.json` already does.
- `games.php` is retired since it becomes a redundant special case once `backend.php` covers `/games.json` generically.
- After each deploy, cache warmup runs once per production domain, not just one.

## Solution

### Merging games.php into backend.php

`/games.json` already matches `backend.php`'s generic `['uri' => '.json', 'type' => 'ends_with']` matcher — `games.php`'s exact-match rule was a carved-out special case, added only to pilot per-domain caching before rolling it out generally. Once `backend.php` gets the same per-domain caching, `games.php` becomes redundant and can be deleted; `/games.json` requests fall through to the general `backend.php` rule.

`games.php` and `backend.php` currently differ structurally:

| | `games.php` | `backend.php` (today) |
|---|---|---|
| Handler-level `'cache'` key | set to the domain-hash path | not set |
| `CacheStalenessMiddleware` `location` | domain-hash path | flat `$cacheFolder` |
| `CacheCleanupMiddleware` | absent | present, with the entity cleanup map |
| Matcher | exact `/games.json`, GET only | any `.json`, any method |

Mirror `games.php` exactly — add the handler-level `'cache'` key to `backend.php` (in addition to keeping `CacheCleanupMiddleware`), and point both the handler's `'cache'` and both middlewares' `location` at the same per-domain hash path (`"$cacheFolder/" . DomainHash::hash(new Request())`), e.g.:

```php
<?php

use Tent\Configuration;
use Tent\Cache\DomainHash;
use Tent\Models\Request;

$backendCacheLocation = "$cacheFolder/" . DomainHash::hash(new Request());

Configuration::buildRule([
    'handler' => [
        'type' => 'default_proxy',
        'host' => $backendHost,
        'cache' => $backendCacheLocation,
        'skip_cache_header' => 'X-Skip-Cache'
    ],
    'matchers' => [
        ['uri' => '.json', 'type' => 'ends_with']
    ],
    'middlewares' => [
        [
            'class' => 'Tent\\Middlewares\\SetClientIpMiddleware'
        ],
        [
            'class'    => 'Tent\\Middlewares\\CacheCleanupMiddleware',
            'location' => $backendCacheLocation,
            'clear'    => ['collection', 'entity'],
            'custom'   => $cacheCleanupMap
        ],
        [
            'class' => 'Tent\\Middlewares\\CacheStalenessMiddleware',
            'location' => $backendCacheLocation,
            'host' => $backendHost,
            'maxAgeSeconds' => 10
        ]
    ]
]);
```

`proxy/prod_configuration/rules/games.php` is then deleted.

### Cleanup/staleness compatibility with per-domain folders

`CacheCleanupMiddleware` and `CacheStalenessMiddleware` treat whatever `location` they're given as their own base folder — there's no nesting concern. Passing the per-domain hash path (instead of the flat `$cacheFolder`) simply scopes each middleware instance to operate entirely within that one domain's folder, same as it already does for `games.php`. Works out of the box, no library-side changes needed.

### Dev environment parity

Prod-only. `dev_configuration/rules/backend.php` stays as-is (no `games.php` equivalent existed there either).

### Cache warmup: warming every domain, not just one

Deployment already invalidates the on-disk cache (per `.circleci/config.yml`), which is why the `warm-up-cache` job exists — it re-warms the cache right after deploy via Navi. Today it only warms a single domain:

- `navi/resources/clients.yml` sets `base_url: $MAJORA_PRODUCTION_URL` (one domain).
- The `warm-up-cache` job sets `NAVI_NAMEPACE="${MAJORA_NAMESPACE}-${CIRCLE_WORKFLOW_WORKSPACE_ID}"`, then `scripts/warm_navi_cache.sh config` (pushes resource files under that one namespace) followed by `scripts/warm_navi_cache.sh engine-start` (starts warming for that one namespace).

Since cache is now partitioned per domain, warmup must run once per domain — its own `base_url` and its own Navi namespace — or only one domain's cache ever gets warmed.

- New CircleCI project env var `MAJORA_PRODUCTION_URLS` (comma-separated), replacing `MAJORA_PRODUCTION_URL`.
- `scripts/warm_navi_cache.sh` splits it, and for each URL pushes a config with a distinct namespace suffixed `-1`, `-2`, ... (re-exporting `NAVI_NAMEPACE`/`MAJORA_PRODUCTION_URL` per iteration before each `navi-client -a config` call — relies on `navi-client`, in the external `darthjee/navi-hey-client` image, substituting `$VAR` tokens found in the yml files from the calling shell's environment at push time, same mechanism the current single-domain flow already relies on).
- Only after **all** per-domain configs are pushed does it trigger warmup — a single `engine-start` call listing every domain's namespace in one `targets` array (the payload already supports an array; today's flow just uses it with one entry).
- The CircleCI step's namespace var is renamed `NAVI_NAMEPACE_BASE` to make clear it's now a prefix, not the final namespace.

```bash
#!/bin/bash

RESOURCE_FILES=(
  navi/resources/games.yml
  navi/resources/npcs.yml
  navi/resources/pcs.yml
  navi/resources/permissions.yml
  navi/resources/treasures.yml
  navi/resources/clients.yml
)

function push_config() {
  FILE_ARGS=()
  for f in "${RESOURCE_FILES[@]}"; do
    FILE_ARGS+=(--file "$f")
  done

  navi-client -b "$NAVI_URL" -t "$NAVI_API_TOKEN" -a config "${FILE_ARGS[@]}"
}

function push_all_configs() {
  IFS=',' read -ra URLS <<< "$MAJORA_PRODUCTION_URLS"
  for i in "${!URLS[@]}"; do
    export NAVI_NAMEPACE="${NAVI_NAMEPACE_BASE}-$((i + 1))"
    export MAJORA_PRODUCTION_URL="${URLS[$i]}"
    push_config
  done
}

function start_engine() {
  IFS=',' read -ra URLS <<< "$MAJORA_PRODUCTION_URLS"
  TARGETS=()
  for i in "${!URLS[@]}"; do
    TARGETS+=("{\"namespace\":\"${NAVI_NAMEPACE_BASE}-$((i + 1))\"}")
  done
  TARGETS_JSON=$(IFS=,; echo "${TARGETS[*]}")

  navi-client -b "$NAVI_URL" -t "$NAVI_API_TOKEN" -a engine-start \
    -p "{\"targets\":[$TARGETS_JSON]}"
}

ACTION=$1

case $ACTION in
  "config")
    push_all_configs
    ;;
  "engine-start")
    start_engine
    ;;
  *)
    $ACTION
    ;;
esac
```

`.circleci/config.yml` (`warm-up-cache` job), only the namespace variable name changes:

```yaml
  warm-up-cache:
    docker:
      - image: darthjee/navi-hey-client:latest
    steps:
      - checkout
      - run:
          name: Set Navi namespace base
          command: echo 'export NAVI_NAMEPACE_BASE="${MAJORA_NAMESPACE}-${CIRCLE_WORKFLOW_WORKSPACE_ID}"' >> "$BASH_ENV"
      - run:
          name: Push navi config
          command: scripts/warm_navi_cache.sh config
      - run:
          name: Start navi engine
          command: scripts/warm_navi_cache.sh engine-start
```

### Rollout note

`MAJORA_PRODUCTION_URLS` is a new required CircleCI project env var, replacing `MAJORA_PRODUCTION_URL`. It must be set in CircleCI project settings **before or alongside** merging/deploying this change — if it's still unset when `warm-up-cache` runs, `push_all_configs`'s loop runs zero iterations and `engine-start` fires with an empty `targets` array, silently warming nothing for every domain.

## Benefits

- Consistent, proven per-domain cache partitioning across all backend endpoints, not just `/games.json`.
- Removes a redundant special-cased rule (`games.php`), simplifying the proxy configuration.
- Cache stays warm for every domain after deploy instead of just one, avoiding cold-cache latency spikes on domains today's warmup misses.
