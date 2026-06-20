# Plan: Add admin to majora

Issue: [72-add-admin-to-majora.md](../issues/72-add-admin-to-majora.md)

## Overview

Django admin is already wired in the backend (`django.contrib.admin` mounted at `/admin/` in `majora_project/urls.py`) but unreachable through the Tent proxy in both dev and production, and production deployment never generates or uploads the admin's static assets. This is purely an infrastructure change: add dedicated proxy rules for `/admin/*` in both environments, and add a CircleCI job to collect and upload the admin static assets, following the same pattern already used in the `weave` project (`weave/.circleci/config.yml`, job `upload_admin_assets`).

## Context

- Backend already has `admin.site.urls` mounted at `/admin/` (`source/majora_project/urls.py`) and `django.contrib.admin` in `INSTALLED_APPS` (`source/majora_project/settings.py`).
- Dev proxy (`docker_volumes/proxy_configuration/`) loads rules in order `frontend.php` → `backend.php` → `redirects.php` (see `configure.php`). `backend.php` only matches requests ending in `.json`, so `/admin/*` currently falls through to `redirects.php`'s catch-all GET redirect to the SPA (`/#/admin/...`), which is wrong.
- Prod proxy (`prod_proxy_config/`) follows the same `frontend.php` → `backend.php` ordering (see `configure.php`). `backend.php` there also only matches `.json`-suffixed requests via `$backendHost`.
- `weave`'s deployment (`weave/.circleci/config.yml`) has a job `upload_admin_assets` that runs `collectstatic`, then uploads the generated assets to `$SSH_REMOTE_TEMP_DIR/static/assets/admin/` using `bin/deploy_frontend.sh generate_folder` / `upload`, and is required by `release_static_files`. Majora's equivalent release job is simply named `release`.
- Checked Tent's `StaticFileHandler` (`tent/source/source/lib/request_handlers/StaticFileHandler.php`): the `static` handler resolves files as `location + full request URI` (the matched prefix is **not** stripped). `weave`'s `STATIC_URL` is `assets/`, which is why Django admin assets there land exactly on `/assets/admin/...` — the same prefix already served by the existing frontend static rule, with no admin-specific static rule needed. Majora's `STATIC_URL` was `/static/`, a prefix the proxy doesn't serve at all. To reuse the same proven pattern as `weave` (no new static rule, just upload to the right place), `STATIC_URL` is changed to `assets/` here too, so admin assets resolve under the existing `/assets` static rule (`frontend.php` in both dev and prod) — the only proxy work still needed is routing the **dynamic** `/admin/*` page requests (login, model views, etc.) to the backend, since those aren't static files and would otherwise hit the catch-all redirect.

## Implementation Steps

### Step 1 — Align `STATIC_URL` with the existing `/assets` static rule

In `source/majora_project/settings.py`, change `STATIC_URL` from `/static/` to `assets/` (matching `weave`'s convention). `STATIC_ROOT` stays `staticfiles` — `collectstatic` still organizes output per-app there (e.g. `staticfiles/admin/...`), only the URL prefix used to address it changes. No other backend code depends on `STATIC_URL`.

### Step 2 — Dev proxy rule for `/admin/*`

Add a new rule file `docker_volumes/proxy_configuration/rules/admin.php` that proxies all `/admin/*` requests to the backend (same `default_proxy` handler/host as `backend.php`, with a `begins_with` matcher on `/admin`). Require it from `configure.php` between `backend.php` and `redirects.php`, so it takes priority over the catch-all redirect.

### Step 3 — Prod proxy rule for `/admin/*`

Add a new rule file `prod_proxy_config/rules/admin.php` with a `default_proxy` handler matching `/admin` (`begins_with`) routed to `$backendHost`, same shape as the existing `.json` rule in `prod_proxy_config/rules/backend.php`. No static handler is needed here — admin's static assets are already covered by the existing `/assets` static rule in `frontend.php`, now that `STATIC_URL` matches that prefix.

Require the new file from `prod_proxy_config/configure.php`, after `backend.php`.

### Step 4 — `upload_admin_assets` CircleCI job

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

### Step 5 — Verify Django admin end to end

After the proxy rules and `STATIC_URL` change are in place, confirm (locally, via `docker-compose up`) that `GET /admin/` and `/admin/login/` resolve through `majora_proxy` to the backend, and that admin's CSS/JS load from `/assets/admin/...`.

## Files to Change

- `source/majora_project/settings.py` — `STATIC_URL` changed from `/static/` to `assets/`
- `docker_volumes/proxy_configuration/rules/admin.php` — new dev rule proxying `/admin/*` to the backend
- `docker_volumes/proxy_configuration/configure.php` — require the new dev admin rule before `redirects.php`
- `prod_proxy_config/rules/admin.php` — new prod rule proxying `/admin/*` to the backend
- `prod_proxy_config/configure.php` — require the new prod admin rule
- `.circleci/config.yml` — new `upload_admin_assets` job, wired into `workflows.test.jobs` and into `release`'s `requires`

## CI Checks

- `docker-compose.yml`, `.circleci/config.yml`, `docker_volumes/proxy_configuration/`, `prod_proxy_config/`: `.claude/scripts/check_infra.sh` (validates `docker-compose config` and parses `.circleci/config.yml` as YAML; also re-runs backend/frontend checks)

## Notes

- `bin/deploy_frontend.sh` is not present in this repo; it's assumed to ship inside `darthjee/circleci_majora-base:0.0.1` the same way it ships inside `darthjee/circleci_weave-base` for the `weave` project. If the image lacks it, fall back to whatever upload mechanism the other jobs in `.circleci/config.yml` already use successfully (e.g. `deploy_frontend.sh` without the `bin/` prefix, as used by `upload_proxy_files`/`upload_fe_files`).
- Tent's exact rule/handler class names (`Configuration::buildRule`, handler `type: default_proxy`, matcher `type: begins_with`) should be copied from the existing `backend.php` files in each environment to stay consistent with current conventions.
- Verified directly against Tent's `StaticFileHandler` source (`location + full URI`, no prefix stripping) before deciding to change `STATIC_URL` rather than add a separate static rule with mismatched path math.
