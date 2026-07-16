# Issue: Add total value to character treasure

## Description
The character read endpoints currently expose a character's `money` but do not expose the total value of treasure the character owns. Add a computed `treasure_value` field, the sum of `total_value` across the character's `CharacterTreasure` rows, to these responses:
- `/games/:game_slug/npcs.json`
- `/games/:game_slug/pcs.json`
- `/games/:game_slug/npcs/:id.json`
- `/games/:game_slug/pcs/:id.json`
- `/games/:game_slug/npcs/:id/full.json`
- `/games/:game_slug/pcs/:id/full.json`
- `/games/:game_slug/npcs/all.json` (DM-only full NPC list, for consistency with the other list endpoints)

## Solution
Sum `total_value` across the character's `character_treasures` (`CharacterTreasure` rows) and expose it as `treasure_value`, alongside the existing `money` field, in `CharacterListSerializer` and `CharacterDetailSerializer`. This is inherited automatically by:
- `CharacterFullSerializer` (extends detail), covering the `full.json` endpoints
- `CharacterFullListSerializer` (extends list), covering `npcs/all.json`

`CharacterTreasure.total_value` is already a stored/maintained field (added by #564), so no new aggregation of per-unit prices is needed — only a sum across the character's rows. For the list endpoints, prefer a queryset `annotate(Sum(...))` over a per-object property to avoid N+1 queries across a paginated list.

## Benefits
Consumers of the character endpoints (e.g. character sheets, GM dashboards) can show a character's total treasure worth without making a separate request per treasure row and summing client-side.
