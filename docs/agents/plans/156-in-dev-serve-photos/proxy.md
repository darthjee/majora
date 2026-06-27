# Proxy Plan: In Dev, Serve Photos

Main plan: [plan.md](plan.md)

## Shared contracts

- **Container path for photos**: `/var/www/html/photos`
  - This agent must use this path as the `location` value in the static handler rule so it matches the volume mount set up by the `infra` agent.

## Implementation Steps

### Step 1 — Create `proxy/dev_configuration/rules/photos.php`

Create a new rule file that serves `GET /photos/*` requests as static files from `/var/www/html/photos`, mirroring the pattern used in `proxy/prod_configuration/rules/photos.php`.

The prod rule uses the production server's host directory as the location. The dev rule must use `/var/www/html/photos` — the path where the `infra` agent will mount `./docker_volumes/photos/`.

## Files to Change

- `proxy/dev_configuration/rules/photos.php` — new file; static rule matching `GET /photos` with `begins_with`, serving from `/var/www/html/photos`

## Notes

- The prod rule (`proxy/prod_configuration/rules/photos.php`) uses `'location' => '/home/moria_user/moria.ffavs.net'` — that is the production server's static root and is not appropriate for dev. Use `/var/www/html/photos` for dev.
- No existing dev rule handles `/photos`, so there is no conflict with other rules.
