# Plan: Extract Central Request Data Source

Issue: [778-extract-central-request-data-source.md](../../issues/778-extract-central-request-data-source.md)

## Overview

Introduce a new, frontend-only `utils/requests/` module that centralizes resource-data
fetching: a resource-configuration registry (regular vs. private/full URL + permission key,
per resource/quantity-type/HTTP-method), a `Request` class that dedupes/caches/aborts a single
logical fetch by delegating to the existing `AccessCache` primitive, and a `RequestStore`
facade that owns the in-memory `Request` instances and reacts to auth/permission/facade
changes the same way `AccessStore` already does. This issue only builds the structure — no
existing controller/component is rewired to use it yet.

## Context

Today, permission-aware data fetching is duplicated ad hoc across page controllers (e.g.
`GameController#fetchNpcsPreview` fires both the regular `npcs.json` and the restricted
`npcs/all.json` request in parallel and picks whichever resolves; `CharacterController` decides
whether to call `fetchCharacterFull` based on a separately-fetched `can_edit` flag). A very
similar generic problem — abort-aware caching, dedup of concurrent calls, and reacting to
route/auth/"view as" changes — is already solved once for *access/permission* checks by
`utils/access/AccessCache.js` + `utils/access/store/AccessStore.js`. This issue extracts an
analogous, but resource-*data*-focused, structure — explicitly reusing `AccessCache` as its
caching engine per the issue's resolved scope (see "Solution" in the issue file), rather than
introducing `@tanstack/react-query` (present in `package.json` but currently unused) or
duplicating `AccessCache`'s logic.

## Implementation Steps

### Step 1 — Resource configuration registry

Create `frontend/assets/js/utils/requests/config/`, one file per resource, each exporting a
plain object shaped like:

```js
{
  collection: {
    regular: { path: ({ gameSlug }) => `/games/${gameSlug}/npcs.json`, permission: null },
    private: { path: ({ gameSlug }) => `/games/${gameSlug}/npcs/all.json`, permission: 'can_edit' },
  },
  single: {
    regular: { path: ({ gameSlug, id }) => `/games/${gameSlug}/npcs/${id}.json`, permission: null },
    private: { path: ({ gameSlug, id }) => `/games/${gameSlug}/npcs/${id}/full.json`, permission: 'can_edit' },
  },
}
```

- `permission: null` means "regular is open to everyone" (still an explicit, present key —
  not an implicit fallback — per the issue's "regular might be an empty array/null meaning
  anyone can request").
- When a resource has no separate private endpoint (e.g. `game`), its `private` entry points
  at the exact same `path`/`permission` as `regular` (no separate object).
- Files: `gameConfig.js`, `npcConfig.js`, `pcConfig.js`, `itemConfig.js`, `treasureConfig.js`
  — one per resource in the issue's "Minimal resource mapping" — each documenting, in a
  file-level comment, which real endpoint(s)/access-control doc section it mirrors.
- `frontend/assets/js/utils/requests/resourceConfig.js` assembles all of the above into one
  keyed map (suggested key shape: `` `${method}:${resource}:${quantityType}` ``, e.g.
  `'GET:npc:collection'`), exposing a single `resourceConfig.get(method, resource, quantityType)`
  lookup — mirroring how `accessRouteConfig.js` centralizes per-page descriptors today.
- GET only for every resource in this issue; the object shape must not need restructuring to
  add `POST`/`PATCH`/`DELETE` keys later (per the issue's "GET requests only" note).

### Step 2 — `Request` class

Create `frontend/assets/js/utils/requests/Request.js`: represents one logical
resource+params+query request.

- Constructed with the resolved `resourceConfig` entry (regular/private path builders +
  permission key), the concrete params (`gameSlug`, `id`, etc.), and the current query
  (filters).
- Exposes an `ensure({ permissions, query, params })`-style method that:
  - Picks `private` vs `regular` based on whether the caller currently has the configured
    `permission` key granted (fail-closed to `regular` when unknown, mirroring
    `AccessStorePermissions`'s fail-closed default).
  - Delegates the actual dedupe/cache/abort mechanics to an internal `AccessCache` instance
    (per the issue's resolved decision to reuse it rather than reimplement), keyed on
    resource + quantity type + params + query + which variant (regular/private) was picked —
    so a query/param/permission-variant change naturally produces a new cache key, which
    `AccessCache` already treats as "no cached entry, aborts nothing else, starts fresh."
  - Wraps the resolved data as `{ data: <payload> }` (the issue's decided consumer-notification
    shape — never mutates a previously-handed-out object in place).
- A superseding-permission case (a private request arriving while a regular request for the
  same resource/params/query is in flight) requires aborting the in-flight regular request
  specifically — `AccessCache.reset()` only supports aborting *everything*, so `Request` needs
  its own explicit "abort the previous variant's entry" step before calling `ensure` for the
  new variant (small, targeted addition on top of `AccessCache`, not a change to it).

### Step 3 — `RequestStore` facade

Create `frontend/assets/js/utils/requests/RequestStore.js` (static class, mirroring
`AccessStore`'s shape):

- Holds one `Request` instance per resource/quantity-type/params combination (an in-memory
  `Map`, analogous to how `AccessCache` keys its own map, but one level up — this map holds
  `Request` objects, not raw cache entries).
- Exposes `RequestStore.ensure({ resource, quantityType, params, query })`, returning the
  `Request`'s promise (creating the `Request` instance on first use).
- Subscribes to `AuthEvents` (auth change) and `AccessEvents.subscribeFacadeChanged` (mock-role
  change) — the same two channels `AppController.js` already wires `AccessStore` to — and, on
  either firing, re-resolves the permission each live `Request` was built with, aborting the
  wrong-permission-variant request and starting the new one (see Step 2's superseding case)
  when necessary. No permission check itself is duplicated here — `RequestStore` calls into
  `AccessStore.ensureCharacterPermissions`/`ensureGamePermissions`/etc. as needed, same as page
  controllers do today.
- `RequestStore.reset()` — aborts every in-flight `Request` and clears the map (used on route
  change / logout, mirroring `AccessStore.reset()`).

### Step 4 — Tests

Add Jasmine specs under `frontend/specs/assets/js/utils/requests/`, mirroring
`specs/.../utils/access/`:
- `config/*ConfigSpec.js` (or one combined `resourceConfigSpec.js`) — asserts each resource's
  regular/private path builders and permission keys match the "Minimal resource mapping" table
  in the issue exactly.
- `RequestSpec.js` — dedupe (repeated `ensure` calls with unchanged params/query/permission
  resolve to the same in-flight promise), cache-hit (no new fetch when nothing changed and data
  is already present), query/param/permission-change triggers a fresh request and a *new*
  `{ data }` wrapper object (not a mutation of the previous one), and the "broader-access
  supersedes narrower" abort case from Step 2.
- `RequestStoreSpec.js` — `ensure()` creates/reuses `Request` instances per key, `reset()`
  aborts everything, and the auth/facade-change subscriptions re-resolve permissions and
  replace requests when the resolved permission actually changes.
- Follow the existing `AccessCacheSpec.js`/`AccessStore*Spec.js` structure/style as the
  reference pattern (already validated for this exact class of abort-aware caching code).

### Step 5 — Documentation

Add a short new section to `docs/agents/frontend.md` (near "API Client") introducing
`utils/requests/` and its three pieces, cross-referencing `utils/access/` as the sibling
pattern it builds on. Do not document any page as "migrated" — none are, in this issue.

## Files to Change

- `frontend/assets/js/utils/requests/config/gameConfig.js` — new: game resource GET config.
- `frontend/assets/js/utils/requests/config/npcConfig.js` — new: npc resource GET config.
- `frontend/assets/js/utils/requests/config/pcConfig.js` — new: pc resource GET config.
- `frontend/assets/js/utils/requests/config/itemConfig.js` — new: character-item resource GET config.
- `frontend/assets/js/utils/requests/config/treasureConfig.js` — new: character-treasure resource GET config.
- `frontend/assets/js/utils/requests/resourceConfig.js` — new: assembles the per-resource configs into one keyed lookup.
- `frontend/assets/js/utils/requests/Request.js` — new: per-resource request/cache/abort/promise logic, built on `AccessCache`.
- `frontend/assets/js/utils/requests/RequestStore.js` — new: in-memory `Request` registry + auth/facade-change reactions.
- `frontend/specs/assets/js/utils/requests/**` — new: Jasmine specs for all of the above.
- `docs/agents/frontend.md` — updated: document the new `utils/requests/` module.

## CI Checks

- `frontend`: `docker-compose run --rm majora_fe yarn lint` (CI job: frontend lint)
- `frontend`: `docker-compose run --rm majora_fe yarn test` (CI job: frontend tests)

## Notes

- No backend or proxy changes — every endpoint in the "Minimal resource mapping" already
  exists; this issue only configures the frontend's view of them.
- Per the issue's Security note, the `security` agent should review `resourceConfig.js` (and
  its per-file configs) specifically for correct regular-vs-private permission-key mapping —
  cross-check against `docs/agents/access-control/character-item.md` and `character-treasure.md`
  as flagged in the issue, since a wrong mapping here would leak restricted data to the
  frontend even though no backend permission logic changes.
- `product-owner`/`data-access` review is not required — no new entity, endpoint, or
  permission rule is introduced; this issue only reflects existing, already-documented access
  rules into frontend configuration.
- Explicitly out of scope (left for a follow-up issue per the issue file): rewiring any
  existing controller (`GameController`, `CharacterController`, etc.) to actually call
  `RequestStore` instead of its current ad hoc fetch logic.
