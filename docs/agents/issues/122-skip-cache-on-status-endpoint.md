# Skip cache on status endpoint

## Context

The Tent proxy caches all responses from `*.json` backend endpoints by default. The `/users/status.json` endpoint returns user-specific data (login state, username, user ID, language preference) that changes per user and per session. Serving it from a shared on-disk cache would cause one user's authentication state to be returned to another user — a correctness bug.

The Tent backend rule already supports a `skip_cache_header` option (`X-Skip-Cache`): when a request includes this header, both cache reads and cache writes are skipped for that request lifecycle.

## What needs to be done

**Frontend:** The frontend client must send the `X-Skip-Cache: 1` request header whenever it calls `/users/status.json`. The `BaseClient.request()` method already checks a `skipCacheEndpoints` set and injects the header automatically — `/users/status.json` must be present in that set.

## Acceptance criteria

- [ ] `GET /users/status.json` requests from the frontend include the `X-Skip-Cache: 1` header.
- [ ] The frontend spec for `AuthClient#status` asserts the `X-Skip-Cache` header is sent.
- [ ] The `BaseClient` spec covers the `/users/status.json` path in the skip-cache set.

---

Tags: :shipit:
