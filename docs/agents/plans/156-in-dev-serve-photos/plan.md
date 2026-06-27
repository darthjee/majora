# Plan: In Dev, Serve Photos

Issue: [156-in-dev-serve-photos.md](../issues/156-in-dev-serve-photos.md)

## Overview

The production Tent proxy routes `GET /photos/*` to a static file handler, but the dev proxy has no equivalent rule. This plan adds a `photos.php` rule to the dev proxy configuration, mounts a local `docker_volumes/photos/` directory into the proxy container, and ignores that directory in `.gitignore`. These two changes are independent — the proxy rule and the infra changes can be implemented in parallel.

## Agents involved

- [proxy](proxy.md)
- [infra](infra.md)

## Shared contracts

- **Container path for photos**: `/var/www/html/photos`
  - The `proxy` agent uses this as the `location` in the static handler rule.
  - The `infra` agent maps `./docker_volumes/photos` to this path in the `majora_proxy` service volumes.
