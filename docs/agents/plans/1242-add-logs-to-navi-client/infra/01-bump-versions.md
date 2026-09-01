# Bump navi/navi-client versions

Bump the local `navi-hey` server image and pin the CI `navi-hey-client` image, so
both sides run the versions this issue's debug-logging feature depends on
(`navi-hey-client` 0.2.0). The CI image was floating on `latest`, unpinned;
fixing that is independent hygiene worth doing regardless of this issue.

**Status: done**, committed on this branch (`0f4a2f08`).

## Files to Change

- `docker-compose.yml` — `majora_navi` service image: `darthjee/navi-hey:1.5.1` →
  `darthjee/navi-hey:1.9.0`.
- `.circleci/config.yml` — `warm-up-cache` job's `docker.image`:
  `darthjee/navi-hey-client:latest` → `darthjee/navi-hey-client:0.2.0`.
