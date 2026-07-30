## API Client

`client/GenericClient.js` is the shared HTTP client (`fetchIndex`, `fetch`, `post`, `patch`)
— read it directly for the exact method signatures.


## Resource Data Requests

`utils/requests/` (issue #778) is a frontend-only, structure-only layer that centralizes
resource-data fetching, mirroring the pattern `utils/access/` already established for
access/permission checks (an `AccessCache`-backed store reacting to route/auth/"view as"
changes). No existing controller/component is rewired to call it yet — that is left for a
follow-up issue. Three cooperating pieces:

- **`resourceConfig.js`** (+ `config/*.js`, one file per resource: `game`, `npc`, `pc`, `item`,
  `treasure`) — a `resourceConfig.get(method, resource, quantityType)` lookup returning the
  resolved `{ regular, private }` pair of `{ path, permission }` entries for that resource's
  `collection`/`single` GET endpoint. `permission` is `null` (open to everyone), a permission-key
  string (e.g. `'can_edit'`), or a function of params, for the rare case where whether a
  restricted endpoint exists at all depends on a param (see `treasureConfig.js`, where only the
  NPC kind has a restricted `/treasures/all.json`). Only `GET` is configured today; the shape
  does not need restructuring to add `POST`/`PATCH`/`DELETE` later.
- **`Request.js`** — one logical resource+quantity-type request. Picks `regular` vs `private`
  based on a caller-supplied permissions object (fail-closed to `regular`), delegates
  dedupe/cache/abort mechanics for the resolved variant+params+query to its own `AccessCache`
  instance, and wraps every settled result as `{ data }` (a fresh object each time, never
  mutated in place). A query/param/permission change aborts the previous variant's in-flight
  fetch and starts a new one — but any promise already handed out to earlier callers stays
  pending and resolves once the *replacement* request settles, instead of being left hanging.
- **`RequestStore.js`** — holds one `Request` per resource/quantity-type/params combination,
  resolving the live permissions each should evaluate via `RequestPermissionResolvers.js`
  (mapping each resource/quantity-type to the matching `AccessStore.ensure*Permissions` call —
  see that file's module doc for the game-level-vs-character-level `can_edit` nuance). Exposes
  `ensure(...)`, `resyncPermissions()`, `reset()`, and a `subscribe()` that wires
  `resyncPermissions()` to `AuthEvents`/`AccessEvents.subscribeFacadeChanged` (not yet called
  from application bootstrap, same "structure only" scope as above).

