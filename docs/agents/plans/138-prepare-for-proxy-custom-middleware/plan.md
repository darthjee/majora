# Plan: Prepare for Proxy Custom Middleware

Issue: [138-prepare-for-proxy-custom-middleware.md](../issues/138-prepare-for-proxy-custom-middleware.md)

## Overview

All proxy-related files are consolidated under a new top-level `proxy/` directory. The dev configuration moves from `docker_volumes/proxy_configuration/` to `proxy/dev_configuration/`, production configuration moves from `prod_proxy_config/` to `proxy/prod_configuration/`, and a new `proxy/custom/` subtree is added with a scaffold for PHP middleware classes and their tests. Docker Compose and CircleCI are updated to reflect the new paths. The architecture doc is updated to match.

## Context

The proxy configuration is currently split across `docker_volumes/proxy_configuration/` (dev) and `prod_proxy_config/` (prod). There is no established place or test harness for custom Tent middleware. This issue co-locates everything under `proxy/` and adds a tested sample middleware.

## Implementation Steps

### Step 1 — Create new directory structure and move files

Move `docker_volumes/proxy_configuration/` to `proxy/dev_configuration/`:
```
git mv docker_volumes/proxy_configuration proxy/dev_configuration
```

Move `prod_proxy_config/` to `proxy/prod_configuration/`:
```
git mv prod_proxy_config proxy/prod_configuration
```

Create the custom middleware scaffold directories:
```
mkdir -p proxy/custom/extend
mkdir -p proxy/custom/tests
```

### Step 2 — Update docker-compose.yml

Two changes in `docker-compose.yml`:

1. In the `majora_proxy` service, change the volume mount from:
   ```
   - ./docker_volumes/proxy_configuration:/var/www/html/configuration/
   ```
   to:
   ```
   - ./proxy/dev_configuration:/var/www/html/configuration/
   ```

2. Add a new test service for the custom middleware. The service uses the `darthjee/tent` image, mounts `proxy/custom/` into the container, and runs the PHP tests. The exact command depends on the Tent image's test runner, but a reasonable default is to run PHPUnit against `proxy/custom/tests/`. Since Tent is a PHP image, the service should be:
   ```yaml
   proxy_tests:
     image: darthjee/tent:0.7.8
     volumes:
       - ./proxy/custom:/var/www/html/custom
     command: vendor/bin/phpunit custom/tests
   ```

### Step 3 — Update CircleCI config

In `.circleci/config.yml`, update the `upload_proxy_files` job's "Upload proxy configuration" step from:
```
SOURCE=prod_proxy_config/ DEPLOY_PATH=configuration/ bin/deploy_frontend.sh upload
```
to:
```
SOURCE=proxy/prod_configuration/ DEPLOY_PATH=configuration/ bin/deploy_frontend.sh upload
```

### Step 4 — Add sample middleware PHP class

Create `proxy/custom/extend/TestHeaderMiddleware.php` implementing a Tent middleware that adds the response header `x-test-header: added`. Follow the `Tent\` namespace convention already used in the proxy configuration rules (e.g. `Tent\Configuration`, `Tent\Middlewares\SetPathMiddleware`).

The class should implement the Tent middleware interface — inspect the Tent image or existing usages to confirm the exact interface. A reasonable scaffold based on the `SetPathMiddleware` pattern:

```php
<?php

namespace Tent\Middlewares;

class TestHeaderMiddleware
{
    public function run(\Tent\Request $request, \Tent\Response $response): void
    {
        $response->addHeader('x-test-header', 'added');
    }
}
```

### Step 5 — Add the middleware test

Create `proxy/custom/tests/TestHeaderMiddlewareTest.php` that exercises `TestHeaderMiddleware` and asserts that the header `x-test-header` is set to `added` after the middleware runs.

### Step 6 — Update architecture documentation

Update `docs/agents/architecture.md` to reflect that routing rules now live in `proxy/dev_configuration/` rather than `docker_volumes/proxy_configuration/`.

## Files to Change

- `docker_volumes/proxy_configuration/` → moved to `proxy/dev_configuration/`
- `prod_proxy_config/` → moved to `proxy/prod_configuration/`
- `proxy/custom/extend/TestHeaderMiddleware.php` — new sample middleware
- `proxy/custom/tests/TestHeaderMiddlewareTest.php` — new test
- `docker-compose.yml` — update volume mount path; add `proxy_tests` service
- `.circleci/config.yml` — update `upload_proxy_files` source path
- `docs/agents/architecture.md` — update proxy config path reference

## CI Checks

- `proxy/custom/tests/`: `docker-compose run proxy_tests` (CI job: indirectly verified via the new `proxy_tests` service in docker-compose; no dedicated CircleCI job yet — the middleware tests run locally via docker-compose)

## Notes

- The Tent middleware interface is not documented in this repo; inspect the `darthjee/tent` image or its GitHub source to confirm exact method signatures before implementing the sample middleware and test.
- The `docker_volumes/proxy_configuration/` subfolder will be empty after the move (only `proxy_configuration/` is moved, not the entire `docker_volumes/`); verify that no other service depends on `docker_volumes/proxy_configuration/` before removing it.
- The `.gitignore` or any scripts referencing `docker_volumes/proxy_configuration` or `prod_proxy_config` should also be checked and updated.
