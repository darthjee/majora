# Plan: Skip cache when X-Skip-Cache header is present

Issue: [67-skip-cache-when-x-skip-cache-header-is-present.md](../../issues/67-skip-cache-when-x-skip-cache-header-is-present.md)

## Overview

Add `skip_cache_header => 'X-Skip-Cache'` to the dev Tent proxy's backend handler config, matching what production already has.

## Context

`prod_proxy_config/rules/backend.php` already sets:
```php
'handler' => [
    'type' => 'default_proxy',
    'host' => $backendHost,
    'skip_cache_header' => 'X-Skip-Cache'
],
```
but `docker_volumes/proxy_configuration/rules/backend.php` (the dev equivalent) only has `type` and `host`, missing `skip_cache_header`. This means requests carrying `X-Skip-Cache` bypass the cache in production but not in dev.

## Implementation Steps

### Step 1 — Add the missing config key

In `docker_volumes/proxy_configuration/rules/backend.php`, add `'skip_cache_header' => 'X-Skip-Cache'` to the `handler` array, alongside the existing `type` and `host` keys.

### Step 2 — Verify locally

Run `docker-compose config -q` to confirm the compose file is still valid, and bring up the dev proxy (`make dev-up` or `docker-compose up majora_proxy majora_app majora_fe`) to confirm the proxy still starts and routes `.json` requests correctly, with and without the `X-Skip-Cache` header.

## Files to Change
- `docker_volumes/proxy_configuration/rules/backend.php` — add `skip_cache_header` to the backend handler config.

## CI Checks
- repo root: `docker-compose config -q` (part of `.claude/scripts/check_infra.sh`, run in CI's `checks` job)

## Notes
- This is a one-line config change; no app code or migration changes needed.
