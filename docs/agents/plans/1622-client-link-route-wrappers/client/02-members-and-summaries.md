# Faction members and summaries

- `Factions`: add `characters(factionId, options)` (a `Page`, via the paginator) and
  `iterateCharacters(factionId, options)` on `factions/<id>/characters` /
  `factions/<id>/characters/all`. Add a `characters` entry to the variant map
  (`{ regular: ':id/characters', restricted: ':id/characters/all' }`) so `pathFor` handles
  encoding and `UsageError`s; existing `Factions` actions keep `restricted: null`.
- `summary(id, kind, characterId, options)` on `Items`, `Documents` and `Factions`:
  `GET <family>/<id>/<kind>/<characterId>/summary` (`/summary/all` when restricted), returning
  the body. `kind` must be `'pcs'` or `'npcs'` (anything else → `UsageError`); blank ids →
  `UsageError`. `pathFor` only replaces `:id`, so build the path in one small shared helper
  (e.g. `client/src/resources/summaryPath.js`, using `encodeSegment`) and keep a `summary`
  entry in each variant map (`{ regular: ':id', restricted: ':id' }` resolved through `pathFor`
  for the id, with the `/<kind>/<characterId>/summary[/all]` suffix appended by the helper) —
  or an equivalent that keeps the "unknown action/variant → `UsageError`" contract.

## Files to Change

- `client/src/resources/Factions.js` — `characters`, `iterateCharacters`, `summary`.
- `client/src/resources/Items.js`, `client/src/resources/Documents.js` — `summary`.
- `client/src/resources/summaryPath.js` — new helper (name at the implementer's discretion).
