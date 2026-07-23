# Plan: Log requests going through RequestStore

Issue: [802-log-requests-going-through-requeststore.md](../issues/802-log-requests-going-through-requeststore.md)

## Overview

Add a new `RequestStoreLogging` class (mirroring the existing `AccessStoreLogging` pattern) that
logs, at `debug` level via `MajoraLogger`, both the start and the settlement (result/error) of
every `RequestStore.ensure()` call. `RequestStore.ensure()` gains a new required `componentName`
argument (alongside its existing `resource`, which already serves as the "resource type"), and
every current caller is updated to pass its own component/controller name.

## Context

`RequestStore.ensure({ resource, quantityType, params, query })` is the single generic entry
point every resource-fetching component goes through (`frontend/assets/js/utils/requests/
RequestStore.js`). There is currently no visibility into which component triggered a given
request. The issue asks for a dedicated log-builder class, used by `RequestStore` itself, with
every caller passing along a component name and (when applicable) resource type so both can be
attached to the log.

The codebase already has an equivalent pattern for a different store: `AccessStoreLogging.wrap
(method, args, fetcherPromise, meta)` (`frontend/assets/js/utils/access/store/
AccessStoreLogging.js`), which logs a promise's outcome (success or error) at `debug` level
without altering it. `RequestStoreLogging` follows the same shape, but — per discussion — also
logs once when the call starts, not only on settlement, since (unlike `AccessStoreLogging`'s
callers, which already know their own method name) `RequestStore.ensure()` has no way to attribute
a call to a component unless the caller passes one in explicitly.

Component name granularity is the class/controller name only (e.g. `'CharacterController'`,
`'GameController'`), not per-method.

## Implementation Steps

### Step 1 — Add `RequestStoreLogging`

Create `frontend/assets/js/utils/requests/RequestStoreLogging.js`, modeled on
`AccessStoreLogging.js`:

```js
import MajoraLogger from '../logging/MajoraLogger.js';

export default class RequestStoreLogging {
  static wrap(componentName, resource, quantityType, params, query, requestPromise) {
    const meta = { componentName, resource, quantityType, params, query };

    MajoraLogger.debug({ ...meta, event: 'start' });

    requestPromise.then(
      (result) => MajoraLogger.debug({ ...meta, event: 'settled', result }),
      (error) => MajoraLogger.debug({ ...meta, event: 'settled', error }),
    );

    return requestPromise;
  }
}
```

Exact field names/shape are a judgment call for the implementing agent — keep it consistent with
`AccessStoreLogging`'s `{method, args, ...meta, result|error}` shape where reasonable, adapted to
`RequestStore`'s own vocabulary (`resource` doubling as resource type, `quantityType`, `params`,
`query`).

### Step 2 — Wire it into `RequestStore.ensure`

Update `RequestStore.ensure` (`frontend/assets/js/utils/requests/RequestStore.js`) to accept a new
`componentName` argument and wrap its returned promise with `RequestStoreLogging.wrap(...)`:

```js
static ensure({ componentName, resource, quantityType, params = {}, query = {} }) {
  const entry = RequestStore.#entryFor(resource, quantityType, params);

  entry.query = query;

  const requestPromise = RequestPermissionResolvers.resolve(resource, quantityType, params)
    .then((permissions) => entry.request.ensure({ permissions, params, query }));

  return RequestStoreLogging.wrap(componentName, resource, quantityType, params, query, requestPromise);
}
```

Update the JSDoc `@param` list accordingly.

### Step 3 — Update every caller to pass `componentName`

Every direct caller of `RequestStore.ensure` must now pass its own class/controller name. Direct
callers (grep confirmed, `frontend/assets/js/components/resources/`):

- `game/pages/controllers/GameController.js` — 3 calls (`#fetchGame`, `#fetchPcsPreview`,
  `#fetchNpcsPreview`) → `componentName: 'GameController'`
- `game/pages/controllers/GameEditController.js` → `'GameEditController'`
- `character/pages/controllers/CharacterController.js` → `'CharacterController'`
- `character/pages/controllers/BaseCharacterItemEditController.js` → `'BaseCharacterItemEditController'`
- `character/pages/controllers/CharacterItemDetailController.js` → `'CharacterItemDetailController'`
- `character/pages/elements/controllers/TreasureExchangeModalController.js` →
  `'TreasureExchangeModalController'`
- `game_session/pages/controllers/GameSessionEditController.js` → `'GameSessionEditController'`
- `item/pages/controllers/GameItemController.js` → `'GameItemController'`
- `item/pages/controllers/GameItemEditController.js` → `'GameItemEditController'`
- `treasure/pages/controllers/TreasureController.js` → `'TreasureController'`
- `treasure/pages/controllers/TreasureEditController.js` → `'TreasureEditController'`
- `treasure/pages/controllers/GameTreasureEditController.js` → `'GameTreasureEditController'`

Indirect caller: `frontend/assets/js/components/common/list_types/fetchRequestStoreList.js`
wraps `RequestStore.ensure` for every `RequestStore`-backed list. Add a `componentName` parameter
to `fetchRequestStoreList({ componentName, resource, params, query, canEdit })` and thread it
through to the `RequestStore.ensure` call inside it. Update its 5 call sites across
`frontend/assets/js/components/common/list_types/configs/`:

- `gamesListType.js`
- `characterListTypes.js` — both `fetchPcs` and `fetchNpcs` (this is the issue's own example: the
  same shared list machinery, reused for `'pcs'` and `'npcs'` with a different `resource`, must
  still be distinguishable in the logs — likely `componentName: 'ListPageController'` for both,
  since `resource` is what actually differentiates them; confirm against how
  `ListPageController.js` names itself)
- `documentListTypes.js`
- `characterTreasureListTypes.js`

### Step 4 — Update/add specs

- `frontend/specs/assets/js/utils/requests/RequestStoreSpec.js` — update existing `ensure()`
  expectations for the new `componentName` argument.
- Add `frontend/specs/assets/js/utils/requests/RequestStoreLoggingSpec.js`, modeled on
  `frontend/specs/assets/js/utils/access/store/AccessStoreLoggingSpec.js` — cover both the
  start-of-call log and the settle (success/error) log.
- `frontend/specs/assets/js/components/common/list_types/fetchRequestStoreListSpec.js` — update
  for the new `componentName` parameter.
- Update specs for each caller controller listed in Step 3 that already asserts on the exact
  `RequestStore.ensure` call arguments.

## Files to Change

- `frontend/assets/js/utils/requests/RequestStoreLogging.js` — new log-builder class (create).
- `frontend/assets/js/utils/requests/RequestStore.js` — accept `componentName`, delegate to
  `RequestStoreLogging.wrap`.
- `frontend/assets/js/components/common/list_types/fetchRequestStoreList.js` — accept and thread
  `componentName`.
- `frontend/assets/js/components/common/list_types/configs/gamesListType.js`,
  `characterListTypes.js`, `documentListTypes.js`, `characterTreasureListTypes.js` — pass
  `componentName` into `fetchRequestStoreList`.
- All 12 direct-caller controllers listed in Step 3 — pass `componentName` into `RequestStore.ensure`.
- `frontend/specs/assets/js/utils/requests/RequestStoreSpec.js`,
  `frontend/specs/assets/js/components/common/list_types/fetchRequestStoreListSpec.js`, plus specs
  for the updated callers — update expectations.
- `frontend/specs/assets/js/utils/requests/RequestStoreLoggingSpec.js` — new spec (create).

## CI Checks

- `frontend`: `npm run lint` (CI job: `frontend-checks`)
- `frontend`: `npm run coverage` (CI job: `jasmine`)

## Notes

- This is frontend-only; no backend or proxy changes are involved.
- `componentName` is the class/controller name only (e.g. `'CharacterController'`), not
  method-qualified — confirmed during issue discussion.
- Logging fires both when a request starts and when it settles (result or error) — confirmed
  during issue discussion, unlike `AccessStoreLogging.wrap` which only logs on settlement.
- The exact `componentName` value to use for the shared `ListPageController`-driven list configs
  (`characterListTypes.js`'s `pcs`/`npcs`, `gamesListType.js`, `documentListTypes.js`,
  `characterTreasureListTypes.js`) is left to the implementing agent's judgment — the important
  constraint is that `resource` (already threaded through) is what actually distinguishes PCs from
  NPCs in the log, not `componentName`.
