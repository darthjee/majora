# crawler Plan: Refactor: split 7 React page/component functions exceeding the 50-line complexity limit

Main plan: [plan.md](plan.md)

## Shared contracts

None — this agent's change is self-contained to `crawler/navi-extension/src/backend/enqueue.js`.

## Implementation Steps

### Step 1 — Split `buildResource` into per-pass builders

`buildResource(slug, bundleInid)` (`crawler/navi-extension/src/backend/enqueue.js:41`, 64 lines) returns a 2-element array: a bundle-pass resource object and a miniature-pass resource object, each fully independent of the other. Extract each array element into its own top-level function:

- `buildCollectionResource(slug)` — returns the first object (the `obj_type: 'bundle'` parser/emit config, currently lines 43–72).
- `buildStlModelResource(bundleInid)` — returns the second object (the `obj_type: 'miniature'` parser/emit config, currently lines 73–102).

`buildResource` itself becomes:

```js
function buildResource (slug, bundleInid) {
  return [buildCollectionResource(slug), buildStlModelResource(bundleInid)];
}
```

Keep the existing comment above `buildResource` (lines 37–40) attached to `buildResource`, and add a short one-line comment on each new function noting which pass it builds. No change to the returned shape, field names, or values — this is a pure extraction.

## Files to Change

- `crawler/navi-extension/src/backend/enqueue.js` — extract `buildCollectionResource` and `buildStlModelResource` out of `buildResource`, per above.

## CI Checks

- `crawler/navi-extension`: `docker compose run --rm extension_tests lint` (CI job: `crawler_extension_tests`)
- `crawler/navi-extension`: `docker compose run --rm extension_tests` (CI job: `crawler_extension_tests`)

## Notes

- `buildResource` is not exported/tested directly today — it's only exercised indirectly through `EnqueueHandler#handle`'s specs in `crawler/navi-extension/tests/backend/enqueue_spec.js` (the `'with a valid, resolvable url'` block). That existing coverage should keep passing unmodified after the split; no new test suite is needed for a purely mechanical extraction.
