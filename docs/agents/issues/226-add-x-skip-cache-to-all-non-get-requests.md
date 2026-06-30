# Issue: Add X-Skip-Cache to All Non-GET Requests

## Description
The frontend's `BaseClient` (frontend/assets/js/client/BaseClient.js) adds the `X-Skip-Cache: 1` header only for specific endpoint pathnames (configured in `skipCacheEndpoints.js`) and path suffixes (configured in `skipCacheSuffixes.js`). This path-based allowlist does not cover write requests (POST, PATCH, DELETE) that are not on those lists, meaning the proxy may cache responses to mutating requests.

The proxy already honors the `X-Skip-Cache` header to bypass its cache layer (`'skip_cache_header' => 'X-Skip-Cache'` in the proxy rule configuration).

## Problem
Write requests such as photo uploads (`POST /games/:game/photo_upload.json`), form submissions (`PATCH /uploads/:id/submit`), and deletions (e.g. `DELETE /users/logout.json`) are not guaranteed to bypass the proxy cache. If the proxy caches a response to one of these requests, subsequent reads may return stale data.

## Expected Behavior
Every non-GET request (POST, PATCH, and DELETE) must include the `X-Skip-Cache: 1` header automatically, regardless of the endpoint path.

## Solution
Extend `BaseClient.request()` (or the private `#shouldSkipCache` helper) so that any request whose HTTP method is POST, PATCH, or DELETE automatically receives the `X-Skip-Cache: 1` header. The existing path-based skip-cache logic for GET requests should remain unchanged.
