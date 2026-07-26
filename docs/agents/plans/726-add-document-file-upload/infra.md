# Infra Plan: Add document file upload

Main plan: [plan.md](plan.md)

## Shared contracts

- New storage root `files`, parallel to the existing `photos` root, needed by proxy (volume mount, prod file location) and backend (`PhotoPathBuilder` root param already covers the app-level path convention `files/games/:game_slug/documents/:id/...`).

## Implementation Steps

### Step 1 — docker-compose files volume
In `docker-compose.yml`, add a new volume line to the `majora_proxy` service, right after the existing photos line (~line 101):
```yaml
      - ./docker_volumes/files:/var/www/html/files
```
`docker_volumes/photos` is a git-ignored, host-side bind-mounted directory (not tracked in the repo) — `docker_volumes/files` follows the same expectation; no directory needs to be created in-repo, just confirm `.gitignore` already covers `docker_volumes/*` broadly (it should, since `photos` isn't tracked either).

### Step 2 — CircleCI `link_files` job
In `.circleci/config.yml`, add a new job mirroring `link_photos` (~lines 362-377):
```yaml
  link_files:
    docker:
      - image: darthjee/tent:0.9.1
    working_directory: /home/app/app
    steps:
      - checkout
      - run:
          name: Generate key file
          command: bin/deploy_frontend.sh generate_key_file
      - run:
          name: Generate folder
          command: bin/deploy_frontend.sh generate_folder
      - run:
          name: Link files
          command: SOURCE=$REMOTE_HOME/files DEPLOY_PATH=files bin/deploy_frontend.sh link
```
(`bin/deploy_frontend.sh` is fully generic over `SOURCE`/`DEPLOY_PATH` — no script changes needed.)

Add a workflow entry for `link_files` (mirroring the `link_photos` entry at ~lines 78-79), with the same `requires`/`filters: *tags_only`.

Add `- link_files` to the `release` job's `requires` list (~lines 90-105), alongside the existing `- link_photos`.

### Step 3 — Confirm prod file storage location
The prod `photos.php` proxy rule serves from `location => '/home/moria_user/moria.ffavs.net'` (implying `photos` lives directly under that root via the existing `link_photos` CircleCI job). Confirm with whoever manages the production host where `files` should live under `$REMOTE_HOME` (mirroring wherever `photos` currently lives there), so the proxy agent's `files.php` rule and `files_path` proxy param point at the right path. This is an infra/ops decision, not something to guess — coordinate directly with the proxy agent's Step 6 before that file is finalized.

## Files to Change
- `docker-compose.yml` — add `files` volume mount.
- `.circleci/config.yml` — add `link_files` job, workflow entry, and `release` dependency.

## CI Checks
- N/A directly (this step changes CI config itself) — verify the updated `.circleci/config.yml` is valid by triggering a CI run on the PR branch (CircleCI validates config on push).

## Notes
- No application code changes here — purely infra wiring. The actual PHP rule file (`files.php`) and its `location`/`files_path` values are the proxy agent's responsibility, but the *destination path* those values should point to is an infra decision (Step 3).
