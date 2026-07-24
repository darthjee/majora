# Issue: Add `HTTP_METHOD` in `RequestStore` logs

## Scenario
In the frontend, `RequestStore` (`frontend/assets/js/utils/requests/RequestStore.js`) centralizes both read (`ensure()`, always `GET`) and mutation (`mutate()`, `POST`/`PATCH`/`PUT`) requests for resource data. Every call is logged via `RequestStoreLogging.wrap()` (`frontend/assets/js/utils/requests/RequestStoreLogging.js`), which logs a `start` event and a `settled` event at debug level.

## Problem
`RequestStoreLogging.wrap()`'s log entries carry `componentName`, `resource`, `quantityType`, `params`, and `query`, but never the HTTP method. Since `ensure()` (GET) and `mutate()` (POST/PATCH/PUT) both log through the same shape, it is hard to tell from the logs alone which requests are reads and which are mutations.

## Solution
Add a `method` field to the log entries produced by `RequestStoreLogging.wrap()`, matching the camelCase style of the existing fields (`componentName`, `resource`, `quantityType`, `params`, `query`):
- `RequestStore.mutate()` already receives `method` (`POST`/`PATCH`/`PUT`) — pass it through to `wrap()`.
- `RequestStore.ensure()` has no explicit `method` argument (it is always a `GET`) — pass `'GET'` explicitly so its logs carry the same field.

## Benefits
Makes debug logs unambiguous about which HTTP verb each request used, without altering the promise/response contract of `ensure()`/`mutate()`.
