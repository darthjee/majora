# Plan: Infra: derived navi-hey image + docker-compose service for the crawler Enqueue UI

Issue: [1298-infra-derived-navi-hey-image-docker-compose-service-for-the-crawler-enqueue-ui.md](../../issues/1298-infra-derived-navi-hey-image-docker-compose-service-for-the-crawler-enqueue-ui.md)

## Overview

Bakes the already-merged Navi Enqueue extension (`crawler/navi-extension/dist/`, `crawler/navi_config.web.yaml`) into a new derived `darthjee/navi-hey` image and adds the local-only docker-compose service a maintainer uses to run it, so the interactive Lootstudios collection-Enqueue UI has an actual `docker compose up` entry point instead of only a manual bind-mount. No CI build/publish, no deploy.

See [infra.md](infra.md) for the full plan.
