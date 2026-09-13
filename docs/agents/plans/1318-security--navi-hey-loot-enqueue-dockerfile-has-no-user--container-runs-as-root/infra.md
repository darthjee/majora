# Infra Plan: Security: navi_hey_loot_enqueue Dockerfile has no USER, container runs as root

## Overview
`dockerfiles/navi_hey_loot_enqueue/Dockerfile` (used by the `crawler_navi_web` service in `docker-compose.yml`) has no `USER` directive, so the container runs as whatever user the `darthjee/navi-hey` base image defaults to — potentially `root`. Every other image in `dockerfiles/` ends on an explicit non-root `USER`. Add `USER node` before the final `CMD`, matching the base image's own user/home layout (`/home/node`), already evidenced by this Dockerfile's `COPY` destinations and by `docker-compose.yml`'s plain `majora_navi` service mounting a volume at `/home/node/app`.

## Implementation Steps

### Step 1 — Add `USER node` before the final `CMD`
Edit `dockerfiles/navi_hey_loot_enqueue/Dockerfile` to add a `USER node` line immediately before the `CMD` instruction, after the existing `COPY`/`ENV` lines. Leave the `COPY` instructions as-is (root-owned by default) — only the runtime process needs to drop to `node`; no `--chown` is required since the copied config/extension files only need to be readable by `node`, which they will be by default.

## Files to Change
- `dockerfiles/navi_hey_loot_enqueue/Dockerfile` — add `USER node` before `CMD`

## Notes
- No CI job currently builds this image, so there is no automated check to update; verify manually with `docker compose build crawler_navi_web` followed by `docker compose run --rm crawler_navi_web whoami` (expect `node`, not `root`).
- If `docker compose run` reports a permission error reading `/home/node/app/config/*.yml` or `/navi/extensions/`, the copied files' default root ownership is the cause — add `--chown=node:node` to the relevant `COPY` lines rather than reverting to root.
