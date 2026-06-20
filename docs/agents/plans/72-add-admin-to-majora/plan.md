# Plan: Add admin to majora

Issue: [72-add-admin-to-majora.md](../issues/72-add-admin-to-majora.md)

## Overview

Django admin is already wired in the backend (`django.contrib.admin` mounted at `/admin/` in `majora_project/urls.py`) but unreachable through the Tent proxy in both dev and production, and production deployment never generates or uploads the admin's static assets. This is purely an infrastructure change: add dedicated proxy rules for `/admin/*` in both environments, and add a CircleCI job to collect and upload the admin static assets, following the same pattern already used in the `weave` project (`weave/.circleci/config.yml`, job `upload_admin_assets`).

## Context

- Backend already has `admin.site.urls` mounted at `/admin/` (`source/majora_project/urls.py`) and `django.contrib.admin` in `INSTALLED_APPS` (`source/majora_project/settings.py`) — no backend change is needed.
- Dev proxy (`docker_volumes/proxy_configuration/`) loads rules in order `frontend.php` → `backend.php` → `redirects.php` (see `configure.php`). `backend.php` only matches requests ending in `.json`, so `/admin/*` currently falls through to `redirects.php`'s catch-all GET redirect to the SPA (`/#/admin/...`), which is wrong.
- Prod proxy (`prod_proxy_config/`) follows the same `frontend.php` → `backend.php` ordering (see `configure.php`). `backend.php` there also only matches `.json`-suffixed requests via `$backendHost`.
- `weave`'s deployment (`weave/.circleci/config.yml`) has a job `upload_admin_assets` that runs `collectstatic`, then uploads the generated assets to `$SSH_REMOTE_TEMP_DIR/static/assets/admin/` using `bin/deploy_frontend.sh generate_folder` / `upload`, and is required by `release_static_files`. Majora's equivalent release job is simply named `release`.

## Implementation Steps

### Step 1 — Dev proxy rule for `/admin/*`

Add a new rule file `docker_volumes/proxy_configuration/rules/admin.php` that proxies all `/admin/*` requests to the backend (same `default_proxy` handler/host as `backend.php`, with a `begins_with` matcher on `/admin`). Require it from `configure.php` between `backend.php` and `redirects.php`, so it takes priority over the catch-all redirect.

### Step 2 — Prod proxy rule for `/admin/*`

Add a new rule file `prod_proxy_config/rules/admin.php` with two rules:
- A `static` handler serving the uploaded admin assets (uploaded to `static/assets/admin/` per Step 3) for paths beginning with `/static/admin` (or whatever URL prefix Django's `collectstatic` + `STATIC_URL` produce for the admin app — verify against `STATIC_URL = '/static/'` in `source/majora_project/settings.py`).
- A `default_proxy` handler matching `/admin` (`begins_with`) routed to `$backendHost`, same shape as the existing `.json` rule in `prod_proxy_config/rules/backend.php`.

Require the new file from `prod_proxy_config/configure.php`, after `backend.php`.

### Step 3 — `upload_admin_assets` CircleCI job

Add a new job to `.circleci/config.yml`, modeled on `weave`'s `upload_admin_assets`:

```yaml
upload_admin_assets:
  docker:
    - image: darthjee/circleci_majora-base:0.0.1
  steps:
    - checkout
    - run:
        name: Set folder
        command: rm frontend -rf; cp source/* ./ -r; rm source -rf
    - run:
        name: Poetry Install
        command: poetry install --no-root --no-interaction --no-ansi
    - run:
        name: Collect static files
        command: python manage.py collectstatic --noinput
    - run:
        name: Generate key file
        command: bin/deploy_frontend.sh generate_key_file
    - run:
        name: Generate folder
        command: SSH_REMOTE_TEMP_DIR=$SSH_REMOTE_TEMP_DIR/static/assets/admin/ bin/deploy_frontend.sh generate_folder
    - run:
        name: Upload admin assets
        command: SOURCE=staticfiles/admin/ SSH_REMOTE_TEMP_DIR=$SSH_REMOTE_TEMP_DIR/static/assets/admin/ bin/deploy_frontend.sh upload
```

Note: source path is `staticfiles/admin/` (not `assets/admin/` like weave) because Majora's `STATIC_ROOT` is `staticfiles` (see `source/majora_project/settings.py`) — only the admin app's subfolder needs uploading, since the rest of the frontend's static assets are already uploaded by `upload_fe_files`.

Wire the new job into the `workflows.test.jobs` list with the same `requires`/`filters` shape as `upload_fe_files`, and add it to `release`'s `requires` list so the release step waits for the admin assets to be uploaded too.

### Step 4 — Verify Django admin end to end

No code change expected. After the proxy rules are in place, confirm (locally, via `docker-compose up`) that `GET /admin/` and `/admin/login/` resolve through `majora_proxy` to the backend, and that admin's CSS loads once a production-like static path is configured.

## Files to Change

- `docker_volumes/proxy_configuration/rules/admin.php` — new dev rule proxying `/admin/*` to the backend
- `docker_volumes/proxy_configuration/configure.php` — require the new dev admin rule before `redirects.php`
- `prod_proxy_config/rules/admin.php` — new prod rule serving admin static assets and proxying `/admin/*` to the backend
- `prod_proxy_config/configure.php` — require the new prod admin rule
- `.circleci/config.yml` — new `upload_admin_assets` job, wired into `workflows.test.jobs` and into `release`'s `requires`

## CI Checks

- `docker-compose.yml`, `.circleci/config.yml`, `docker_volumes/proxy_configuration/`, `prod_proxy_config/`: `.claude/scripts/check_infra.sh` (validates `docker-compose config` and parses `.circleci/config.yml` as YAML; also re-runs backend/frontend checks)

## Notes

- The exact static URL prefix Django's admin assets are served under (`/static/admin/...`) depends on `STATIC_URL` (`/static/`) — the new prod static rule must match that prefix, not assume `/assets/admin` as literally suggested by the original issue text.
- `bin/deploy_frontend.sh` is not present in this repo; it's assumed to ship inside `darthjee/circleci_majora-base:0.0.1` the same way it ships inside `darthjee/circleci_weave-base` for the `weave` project. If the image lacks it, the infra agent should fall back to whatever upload mechanism the other jobs in `.circleci/config.yml` already use successfully (e.g. `deploy_frontend.sh` without the `bin/` prefix, as used by `upload_proxy_files`/`upload_fe_files`).
- Tent's exact rule/handler class names (`Configuration::buildRule`, handler `type: static`/`default_proxy`, matcher `type: begins_with`) should be copied from the existing `backend.php`/`frontend.php` files in each environment to stay consistent with current conventions.
