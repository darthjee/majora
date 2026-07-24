# Plan: Add `HTTP_METHOD` in `RequestStore` logs

Issue: [837-add--http-method--in--requeststore--logs.md](../../issues/837-add--http-method--in--requeststore--logs.md)

## Overview
`RequestStoreLogging.wrap()` currently logs `componentName`, `resource`, `quantityType`, `params`, and `query`, but never the HTTP method, so `ensure()` (`GET`) and `mutate()` (`POST`/`PATCH`/`PUT`) requests are indistinguishable in the debug logs. Add a `method` field (camelCase, matching the existing fields) to `wrap()`'s log entries, threading it through from `RequestStore.mutate()` (which already has it) and hardcoding `'GET'` from `RequestStore.ensure()` (which doesn't have an explicit method).

## Context
- `frontend/assets/js/utils/requests/RequestStoreLogging.js` exposes a single static `wrap(componentName, resource, quantityType, params, query, requestPromise)` that logs a `start` event immediately and a `settled` event (with `result` or `error`) once `requestPromise` settles, then returns the promise unchanged.
- `frontend/assets/js/utils/requests/RequestStore.js` has two callers of `wrap()`:
  - `ensure()` — always a `GET`, no `method` argument exists today.
  - `mutate()` — receives `method` (`'POST'` | `'PATCH'` | `'PUT'`) as one of its own arguments, but currently drops it before calling `wrap()`.
- `resolvePath()` also takes a `method` but does not log through `wrap()` at all (it never fires a request), so it is out of scope for this issue.

## Implementation Steps

### Step 1 — Add a `method` parameter to `RequestStoreLogging.wrap()`
Add `method` as a new parameter (insert it next to the other meta fields — e.g. right after `componentName`, before `resource`, or wherever reads best next to the existing JSDoc `@param` order) and include it in the `meta` object spread into both the `start` and `settled` log calls. Update the JSDoc `@param` list to document it (e.g. `{string} method - HTTP method (\`'GET'\`, \`'POST'\`, \`'PATCH'\`, or \`'PUT'\`).`).

### Step 2 — Pass `method` from both `RequestStore` callers
- In `RequestStore.ensure()`, pass `'GET'` as the new `method` argument to `RequestStoreLogging.wrap()`.
- In `RequestStore.mutate()`, pass the existing `method` argument (already destructured from `mutate()`'s own params) through to `RequestStoreLogging.wrap()`.

Keep argument order consistent between the two call sites and the updated `wrap()` signature.

### Step 3 — Update specs
Update `frontend/specs/assets/js/utils/requests/RequestStoreLoggingSpec.js` so every `RequestStoreLogging.wrap(...)` call passes a `method` argument (e.g. `'GET'`), and every `expect(debugSpy).toHaveBeenCalledWith({...})` assertion includes the matching `method` field in the expected object (for both the `start` and `settled` log shapes).

Check `frontend/specs/assets/js/utils/requests/RequestStoreSpec.js` (or wherever `RequestStore.ensure()`/`mutate()` are already spec'd) for any assertions that stub or assert on `RequestStoreLogging.wrap()`'s call arguments — update those to include `method` too if present.

## Files to Change
- `frontend/assets/js/utils/requests/RequestStoreLogging.js` — add `method` param to `wrap()`, include it in `meta`, update JSDoc.
- `frontend/assets/js/utils/requests/RequestStore.js` — pass `'GET'` from `ensure()` and the existing `method` from `mutate()` into `wrap()`.
- `frontend/specs/assets/js/utils/requests/RequestStoreLoggingSpec.js` — add `method` to every `wrap()` call and matching log assertion.
- `frontend/specs/assets/js/utils/requests/RequestStoreSpec.js` (if it asserts on `wrap()` call args) — update accordingly.

## CI Checks
- `frontend`: `npm run coverage` (CI job: `jasmine`)
- `frontend`: `npm run lint` (CI job: `frontend-checks`)

## Notes
- `RequestStore.resolvePath()` also accepts a `method` but never calls `wrap()` (it doesn't fire a request), so no change is needed there.
- `DELETE` is mentioned in the issue's problem description as a mutation verb, but `RequestStore.mutate()` doesn't support it yet (only `POST`/`PATCH`/`PUT`) — no action needed here; passing `method` through generically means `DELETE` will log correctly automatically once/if it's added to `mutate()`.
