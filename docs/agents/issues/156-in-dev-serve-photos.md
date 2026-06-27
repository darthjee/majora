# Issue: In dev, serve photos

## Description
The production proxy configuration (`proxy/prod_configuration/rules/photos.php`) serves static photo files under `/photos` URIs. The development proxy configuration (`proxy/dev_configuration/rules/`) has no equivalent rule, so photos are unavailable in the local development environment.

## Problem
Photo URLs (e.g. `/photos/...`) resolve correctly in production but return 404 in the dev environment because:
1. `proxy/dev_configuration/rules/photos.php` does not exist.
2. The `majora_proxy` service in `docker-compose.yml` has no volume mapping for `docker_volumes/photos`.
3. The `docker_volumes/photos/` directory is not ignored in `.gitignore`, so any photos placed there could be accidentally committed.

## Expected Behavior
In the local dev environment, `GET /photos/*` requests are served as static files from a local folder (`docker_volumes/photos/`), mirroring the production behaviour.

## Solution
1. Create `proxy/dev_configuration/rules/photos.php` — a static rule that serves `/var/www/html/photos` for URIs beginning with `/photos`, matching the pattern used by other static rules in the dev configuration.
2. Add a volume mapping to the `majora_proxy` service in `docker-compose.yml`:
   `./docker_volumes/photos:/var/www/html/photos`
3. Add `docker_volumes/photos/` to `.gitignore` so locally stored photo files are not committed.
