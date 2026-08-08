# Plan: Use per domain cache for all backend endpoints

Issue: [1027-use-per-domain-cache-for-all-backend-endpoints.md](../issues/1027-use-per-domain-cache-for-all-backend-endpoints.md)

## Overview

`proxy/prod_configuration/rules/games.php` piloted per-domain caching (via `DomainHash`) for `/games.json` and it worked well. This plan generalizes that same pattern to every backend `.json` endpoint in `proxy/prod_configuration/rules/backend.php`, then deletes `games.php` since it becomes a redundant special case. Because caching becomes domain-partitioned everywhere instead of just for `/games.json`, the deploy-time Navi cache warmup is extended to warm every production domain, not just one.

## Agents involved

- [proxy](proxy.md)
- [infra](infra.md)

## Shared contracts

There's no code-level interface between the two agents' changes — `proxy`'s per-domain cache folders (`domain_<sha256(domain)>`) are entirely internal to the Tent proxy and never referenced by the warmup script or CI config. The contract is behavioral instead:

- **The set of domains `infra`'s `MAJORA_PRODUCTION_URLS` lists must match every production domain served through the proxy.** Each domain gets its own cache folder once `proxy`'s change lands; any domain missing from `MAJORA_PRODUCTION_URLS` never gets warmed after deploy and eats a cold-cache latency hit until organic traffic fills it in (cache entries go stale after `maxAgeSeconds=10`).
- **Rollout ordering**: `infra`'s new `MAJORA_PRODUCTION_URLS` CircleCI project env var must be set (replacing `MAJORA_PRODUCTION_URL`) before or alongside this change deploying — this is an external CircleCI project-settings action, not a code change, and isn't something either agent's diff can enforce by itself.
