# Issue: Remove periodic health check

## Description

The frontend periodically pings `/health.json` to detect whether the backend was up, showing a superuser-only status indicator based on the result. The project is moving to a more reliable infra setup that guarantees the server is up around the clock, making this client-side polling unnecessary.

## Expected Behavior

No periodic requests to `/health.json` are made by the frontend, the endpoint itself no longer exists on the backend, and the superuser-only server status indicator is gone from the header.

## Solution

Remove the health-check mechanism end to end:

- **Backend endpoint**: `games/views/health.py` (the `health` view), its registration in `games/urls/system.py` (`health.json`), the `views/__init__.py` export, the middleware special-case in `games/middleware.py` that skips `Cache-Control` for `/health.json`, and the corresponding test (`games/tests/views/health_test.py`).
- **Frontend polling**: `HealthClient.js`, and `HeaderController`'s `startHealthCheck`/`stopHealthCheck`/`#pollHealth` plus their call sites in `Header.jsx`. Also remove the `skipCacheEndpoints.js` entry for `/health.json`.
- **UI indicator**: the superuser-only server status dot (`HeaderHelper.jsx#renderServerStatus`) and the `serverStatus`/`setServerStatus` state threaded through `Header.jsx` and `HeaderController`.
- **Keep-alive hook**: the request-activity tracking that exists solely to pause health polling during idle periods — `ActivityTracker.js`, `BaseClient`'s `#shouldRegisterActivity` check and its `ActivityTracker.register()` call, and the `activityEndpoints.js` allowlist config.
- **Tests**: `HealthClientSpec.js`, `startHealthCheckSpec.js`, `stopHealthCheckSpec.js`, `activityTrackingSpec.js`, and any health/server-status assertions in `HeaderSpec.js`.

Out of scope: `HeaderRouteResolver.js`, `HeaderViewAsController.js`, and `HeaderGameAccessController.js` only reference health-check orchestration in doc comments (no functional dependency) — those comments should just be updated during implementation, not treated as a design concern here.

## Benefits

Fewer background requests from every open client, a smaller/simpler client surface (no idle-tracking hook needed just to pause a poll), and one less endpoint to maintain now that infra guarantees uptime.
