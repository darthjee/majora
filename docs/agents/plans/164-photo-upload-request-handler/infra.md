# Infra Plan: Add photo upload request handler

Main plan: [plan.md](plan.md)

## Shared contracts

The `proxy` agent creates all PHP extension code under `proxy/extension/`, including
`loader.php`, `PhotoUploadHandler.php`, `TestHeaderMiddleware.php`, and tests under
`proxy/extension/tests/`. This agent ensures `docker-compose.yml` mounts that directory
correctly so Tent and the test runner can find those files.

Volumes to add:
- `./proxy/extension:/var/www/html/extension` on `majora_proxy` (Tent auto-loads `loader.php` from here)
- `./proxy/extension:/var/www/html/extension` on `proxy_tests` (so phpunit can find source files)

Volume to remove from `proxy_tests`:
- `./proxy/custom:/var/www/html/custom` (no longer used once proxy migrates all code to extension/)

Test command for `proxy_tests` to change:
- From: `vendor/bin/phpunit custom/tests`
- To: `vendor/bin/phpunit extension/tests`

## Implementation Steps

### Step 1 — Mount proxy/extension in majora_proxy

In `docker-compose.yml`, add `./proxy/extension:/var/www/html/extension` to the `volumes`
list of the `majora_proxy` service, alongside the existing mounts. Tent 0.8.0 auto-loads
`/var/www/html/extension/loader.php` when this directory is present.

### Step 2 — Update proxy_tests service

In `docker-compose.yml`, update the `proxy_tests` service:
- Replace the volume `./proxy/custom:/var/www/html/custom` with
  `./proxy/extension:/var/www/html/extension`.
- Change the `command` from `vendor/bin/phpunit custom/tests` to
  `vendor/bin/phpunit extension/tests`.

## Files to Change

- `docker-compose.yml` — add volume mount to `majora_proxy`; update `proxy_tests` volumes
  and command

## CI Checks

- `docker-compose.yml` is used by all CI jobs; no dedicated linting job exists for it.

## Notes

- Do not touch any PHP files — all PHP work is owned by the `proxy` agent.
- The `proxy/custom/` directory is left in the repo (the proxy agent may leave it as an
  empty folder). The only change here is removing its volume mount from `proxy_tests`.
