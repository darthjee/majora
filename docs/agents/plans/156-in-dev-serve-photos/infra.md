# Infra Plan: In Dev, Serve Photos

Main plan: [plan.md](plan.md)

## Shared contracts

- **Container path for photos**: `/var/www/html/photos`
  - This agent must mount `./docker_volumes/photos` to this exact path in the `majora_proxy` service so the proxy rule written by the `proxy` agent resolves correctly.

## Implementation Steps

### Step 1 — Add volume mapping to `majora_proxy` in `docker-compose.yml`

Add the following line to the `majora_proxy` service's `volumes` list:

```
- ./docker_volumes/photos:/var/www/html/photos
```

This makes locally stored photo files available inside the proxy container at the path the dev `photos.php` rule will reference.

### Step 2 — Add `docker_volumes/photos/` to `.gitignore`

Append `docker_volumes/photos/` to `.gitignore` (under the existing "# Docker volumes" section) so that any photo files placed there for local testing are never accidentally committed.

## Files to Change

- `docker-compose.yml` — add volume entry `./docker_volumes/photos:/var/www/html/photos` to the `majora_proxy` service
- `.gitignore` — add `docker_volumes/photos/` under the `# Docker volumes` section

## Notes

- The `docker_volumes/photos/` directory does not need to be created in the repository — Docker will create it on first run, or developers can create it manually. Do not commit an empty directory.
- No CircleCI changes are needed: this is a dev-environment-only change and the CI pipeline does not run integration tests against the proxy.
