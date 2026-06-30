# Plan: Add X-Skip-Cache to All Non-GET Requests

Issue: [226-add-x-skip-cache-to-all-non-get-requests.md](../issues/226-add-x-skip-cache-to-all-non-get-requests.md)

## Overview

Extend `BaseClient.#shouldSkipCache()` to also return `true` for any request whose HTTP method is POST, PATCH, or DELETE. The existing path-based logic (configured endpoints and suffixes) that applies to GET requests remains unchanged.

## Context

`BaseClient.request()` uses a private `#shouldSkipCache(pathname)` helper that only considers the request path. Write requests (POST, PATCH, DELETE) that are not on the path-based allowlist do not receive the `X-Skip-Cache: 1` header, meaning the proxy may cache their responses. The proxy already honors `X-Skip-Cache` to bypass its cache layer.

## Implementation Steps

### Step 1 — Update `#shouldSkipCache` to accept the HTTP method

Change the private helper signature from `#shouldSkipCache(pathname)` to `#shouldSkipCache(method, pathname)`. Add a guard at the top of the method: if `method` is `'POST'`, `'PATCH'`, or `'DELETE'`, return `true` immediately. The rest of the path-based logic is unchanged.

Update the call site in `request()` from `this.#shouldSkipCache(pathname)` to `this.#shouldSkipCache(method, pathname)`.

Update the JSDoc on both `request()` (no interface change, but the described behaviour changes) and `#shouldSkipCache` to reflect the new rule.

### Step 2 — Update the spec

The existing test "does not add X-Skip-Cache to a non-configured endpoint" uses `method: 'POST'` and expects no `X-Skip-Cache` header. After the fix this test's expectation is wrong. Change it to use `method: 'GET'` (a plain GET to an unconfigured endpoint), which is the scenario that should still skip the header.

Add three new spec cases to cover the new behaviour:
- POST to an unconfigured endpoint receives `X-Skip-Cache: 1`
- PATCH to an unconfigured endpoint receives `X-Skip-Cache: 1`
- DELETE to an unconfigured endpoint receives `X-Skip-Cache: 1`

## Files to Change

- `frontend/assets/js/client/BaseClient.js` — extend `#shouldSkipCache` to accept method and short-circuit for POST/PATCH/DELETE; update call site and JSDoc
- `frontend/specs/assets/js/client/BaseClientSpec.js` — fix the existing non-configured-endpoint test; add three new method-based skip-cache tests

## CI Checks

- `frontend/`: `docker-compose run --rm majora_fe yarn test` (CI job: `jasmine`)
- `frontend/`: `docker-compose run --rm majora_fe yarn lint_fix` (CI job: `frontend-checks`)

## Notes

- `config/skipCacheEndpoints.js` and `config/skipCacheSuffixes.js` are not changed — the path-based allowlist for GET requests stays intact.
- The `#shouldRegisterActivity` helper already handles the POST/PATCH/DELETE distinction independently; no change needed there.
