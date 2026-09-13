# Issue: Security: navi_hey_loot_enqueue Dockerfile has no USER, container runs as root

## Description
A Codacy SRM (IaC) [finding](https://app.codacy.com/p/880653/issues/index?resultDataId=131538259581) flags `dockerfiles/navi_hey_loot_enqueue/Dockerfile` for having no `USER` directive at all, meaning the container runs as whatever user the base image leaves active — potentially `root`.

## Problem
```dockerfile
ARG NAVI_TAG=1.11.1
FROM darthjee/navi-hey:${NAVI_TAG}

COPY crawler/navi-extension/dist/ /navi/extensions/
COPY crawler/navi-extension/config/menu.yml /home/node/app/config/menu.yml
COPY crawler/navi_config.web.yaml crawler/navi_config.yaml /home/node/app/config/

ENV NAVI_EXTENSIONS_ENABLED=true

CMD ["navi-hey", "--config", "/home/node/app/config/navi_config.web.yaml"]
```

Every other image under `dockerfiles/` ends on an explicit non-root `USER` (e.g. `app` for the `majora`/`majora-base` family, `node` for `vite_majora`/`vite_majora-base` and `markdownlint`, `circleci` for `circleci_majora-base`). This is the only image left running as whatever the base image defaults to.

The base image's non-root user is already inferable from this repo: `docker-compose.yml`'s `majora_navi` service runs the stock `darthjee/navi-hey:1.11.1` image unmodified and mounts a volume at `/home/node/app`, and this Dockerfile's own `COPY` destinations already target `/home/node/app/config/` — both point to a `node` user with home `/home/node`, matching the same convention already used by this repo's other `darthjee/node`-based images (e.g. `vite_majora-base`).

## Expected Behavior
The `crawler_navi_web` container (built from this Dockerfile) should run as a non-root user, consistent with every other image built in this repo.

## Solution
Add an explicit `USER node` directive to `dockerfiles/navi_hey_loot_enqueue/Dockerfile`, placed after the `COPY`/`ENV` instructions and before the final `CMD` (the `COPY` instructions need root to write outside the copied files' owning user unless `--chown=node:node` is added; simplest is to keep `COPY` as root-default and add `USER node` immediately before `CMD`).

## Benefits
- Container no longer runs as `root`, reducing impact of a container-escape or dependency-compromise scenario.
- Brings this image in line with the least-privilege convention already followed by every other image in `dockerfiles/`.
- Resolves the Codacy SRM (IaC) finding.
