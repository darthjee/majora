# Character link sub-wrappers

Add a shared base `CharacterLinks extends Resource` (constructor
`(http, paginator, characterBasePath, characterId)`, base path
`<characterBasePath>/<encoded characterId>/<static segment>`, blank id → `UsageError`
`Missing character id`, `characterId` getter), modelled on `DocumentPages`.

Subclasses and their variant maps (regular / restricted):

| Action | `CharacterItems` (`items`) / `CharacterDocuments` (`documents`) | `CharacterFactions` (`factions`) |
|---|---|---|
| `list` | `''` / `all` | `''` / `all` |
| `get` | `:id` / `:id/full` | `:id` / `:id/full` |
| `available` | `available` / `available/all` | `available` / `available/all` |
| `acquire` | `acquire` / `acquire/all` | `acquire` / `acquire/all` |
| `remove` | `remove` / `remove/all` | `:id/remove` / `:id/remove/all` |

No `create`/`update` entries, so the inherited methods throw `UsageError`.

Methods on `CharacterLinks`:
- `available(options)` → `paginator.list(pathFor('available'))`, and `iterateAvailable(options)`
  (path resolved synchronously, like `Resource.iterate`).
- `acquire(data, options)` → `http.post(pathFor('acquire'), data, rest)`, returns the body.
- `remove(data, options)` → `http.post(pathFor('remove'), data, rest)` (items/documents).
- `CharacterFactions` overrides `remove(factionId, data = {}, options)` →
  `http.post(pathFor('remove', { id: factionId }), data, rest)`.

On `CharacterResource`, add `items(characterId)`, `documents(characterId)` and
`factions(characterId)` returning the matching wrapper built from `this.basePath`. Export the
new classes from `src/index.js` if the other resource classes are exported there. Full JSDoc
with `@example` blocks matching the existing wrappers.

## Files to Change
- `client/src/resources/CharacterLinks.js` — new shared base.
- `client/src/resources/CharacterItems.js`, `CharacterDocuments.js`, `CharacterFactions.js` — new.
- `client/src/resources/CharacterResource.js` — the three factory methods.
- `client/src/index.js` — exports, if applicable.
