# Resource bases

Add the generic wrapper bases the families build on.

- `Resource`: holds the `HttpClient` and the `Paginator`, plus a base path and a declarative
  **variant map** (`action → { regular, restricted }`, where each entry is a path template or
  `null`). It resolves the path for an action and `{ restricted }` option, and throws
  `UsageError` before any request when the variant (or the action itself) is missing. It
  provides the shared `list(options)` (`Paginator.list` → `Page`), `iterate(options)`
  (`Paginator.iterate`), `get(id, options)`, `create(data, options)` (`POST`) and
  `update(id, data, options)` (`PATCH`). It strips `restricted` before forwarding the remaining
  options (`page`, `perPage`, `query`, `headers`, `timeout`, `retries`, `signal`) and returns the
  parsed body (`Page` for `list`).
- `GameResource`: a `Resource` whose base path is `games/<slug>/<family>`. It throws
  `UsageError` for an empty slug.
- A shared character base (for example `CharacterResource`) for `npcs` and `pcs`, since their
  routes are parallel (`backend/games/urls/_character_routes.py`).

Specs (with the `FetchStub`): path resolution per variant, `UsageError` with zero fetch calls for
a missing variant or action, option forwarding, `Page` / `iterate` behavior, and the HTTP method
and JSON body for `create` / `update`.

## Files to Change

- `client/src/resources/Resource.js` — new base wrapper.
- `client/src/resources/GameResource.js` — new game-scoped base.
- `client/src/resources/CharacterResource.js` — new shared NPC/PC base.
- `client/specs/resources/Resource_spec.js`, `client/specs/resources/GameResource_spec.js` — new
  specs.
