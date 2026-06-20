# Add admin to majora

## Context

Majora has no working `/admin` route in dev or production, even though Django supports an admin site out of the box. Django admin is already wired in the backend (`django.contrib.admin` in `INSTALLED_APPS`, `admin.site.urls` mounted at `/admin/` in `majora_project/urls.py`), but the Tent proxy doesn't route `/admin/*` requests to the backend in either environment, and production deployment doesn't generate or serve the admin's static assets (CSS/JS).

## What needs to be done

**Backend:**
- Verify Django admin already works end to end (no code change expected — confirm `/admin/` is reachable and functional through the backend directly).

**Development (Tent proxy):**
- Add a dedicated proxy rule (new rule file in `docker_volumes/proxy_configuration/rules/`) that proxies all `/admin/*` requests to the backend.
- Load it before `redirects.php` so `/admin/*` isn't caught by the catch-all SPA redirect.

**Deployment (`.circleci/config.yml`):**
- Add a new `upload_admin_assets` job, mirroring the one already used in the `weave` project (see `weave/.circleci/config.yml`):
  - Run `python manage.py collectstatic --noinput` to generate the Django admin static assets.
  - Upload the generated assets to `$SSH_REMOTE_TEMP_DIR/static/assets/admin/` (same path convention as `weave`, keeping admin assets alongside the rest of the frontend's `static/` tree).
- Wire the new job into the `release` chain so the admin assets are released together with the rest of the static files.

**Production (Tent proxy):**
- Add a dedicated proxy rule (new rule file in `prod_proxy_config/rules/`) that:
  - Serves the uploaded admin static assets (`static/assets/admin/...`) as static files.
  - Proxies `/admin/*` requests to the backend.

## Acceptance criteria

- [ ] `/admin/*` is proxied to the backend in dev via a dedicated rule loaded before `redirects.php`.
- [ ] `.circleci/config.yml` has an `upload_admin_assets` job that runs `collectstatic` and uploads to `$SSH_REMOTE_TEMP_DIR/static/assets/admin/`, wired into the `release` job's requirements.
- [ ] Production proxy has a dedicated rule serving admin static assets and proxying `/admin/*` to the backend.
- [ ] Django admin is reachable at `/admin/` in both dev and production.
