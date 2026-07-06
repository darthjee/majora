# Plan: Add acquire treasure

Issue: [312-add-aquire-treasure.md](../issues/312-add-aquire-treasure.md)

## Overview

Add the ability for a character to spend/gain money to acquire or sell treasure. Most of
the read-side plumbing already exists from prior issues (#296/#297/#311): the
`CharacterTreasure` model, its serializer, the `game_pc_treasures`/`game_npc_treasures`
list endpoints, the client-side merge that already feeds `character.treasures` into the
character detail page (`CharacterController#fetchAndMergeTreasures`), the
`PcCharacterTreasures`/`NpcCharacterTreasures` full-list pages, and the GP/SP/CP value
formatter. This plan closes the remaining gaps: exposing `treasure_id` and `photo_path` on
`CharacterTreasureSerializer`, filtering owned-treasure lists to `quantity > 0`, upgrading
the preview section and full-list pages from list/table rendering to treasure-card grids
with a quantity overlay, and adding new atomic acquire/sell endpoints plus the two-tab
modal that calls them.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)

## Shared contracts

### `CharacterTreasureSerializer` (existing, `source/games/serializers/character_treasure.py`)

Gains two fields so the frontend can link to the underlying treasure and render its photo:

```json
{
  "id": 12,           // CharacterTreasure row id (existing, unchanged meaning)
  "treasure_id": 5,   // NEW - the underlying Treasure's id
  "name": "Golden Crown",
  "quantity": 3,
  "value": 500,       // treasure value in copper pieces (existing)
  "photo_path": "/uploads/treasures/5.png"  // NEW - nullable, source treasure.photo.path
}
```

Both `game_pc_treasures`/`game_npc_treasures` (`.../pcs|npcs/<id>/treasures.json`) use this
serializer and gain these two fields identically. Both views must additionally filter to
`quantity__gt=0` (owned-with-zero rows are kept in the DB per the issue but never listed).
This single endpoint is consumed both by the full-list pages and, via
`CharacterController#fetchAndMergeTreasures`, by the character detail page's preview
section — no new backend serializer field is needed on `CharacterDetailSerializer` for the
preview; the frontend already fetches this list separately and merges it as
`character.treasures` (added in #297). The frontend caps the preview at 6 items
client-side (see frontend plan).

### Acquire/sell endpoints (NEW)

Four endpoints, mirroring the existing PC/NPC split:

```
POST games/<slug>/pcs/<character_id>/treasures/acquire.json
POST games/<slug>/pcs/<character_id>/treasures/sell.json
POST games/<slug>/npcs/<character_id>/treasures/acquire.json
POST games/<slug>/npcs/<character_id>/treasures/sell.json
```

Request body (both actions): `{ "treasure_id": <int>, "quantity": <int, >= 1> }`

Success response (200): `{ "quantity": <int, new owned quantity>, "money": <int, new character.money> }`

Validation failure (400): `{ "errors": { "<field>": ["<message>"] } }` (standard
`validated_or_error` shape used across the app).

Permission: `CharacterEditPermission.check(request, character)` (same check already used by
`game_pc_detail`/`game_npc_detail` PATCH and `_slain_set.py`) — 401 if unauthenticated, 403
if authenticated but not the owning player/GameMaster/superuser.

Acquire validates: `treasure_id` resolves to a treasure available in this game (same
`Q(linked_game=game) | Q(game=game)` filter used by `game_treasures`), `quantity >= 1`, and
`quantity * treasure.value <= character.money`. On success, atomically
(`transaction.atomic`) get-or-create the `CharacterTreasure` row, add `quantity` to it, and
subtract `quantity * treasure.value` from `character.money`.

Sell validates: an owned `CharacterTreasure` row exists for `treasure_id` with
`quantity >= <requested quantity>`. On success, atomically subtract `quantity` from the row
(row is kept even at 0, never deleted) and add `quantity * treasure.value` to
`character.money`.

### Acquire-tab browsing (extends existing `game_treasures` list endpoint)

`GET games/<slug>/treasures.json` gains an optional `max_value` query parameter (integer,
copper pieces). When present, the queryset additionally filters `value__lte=max_value`. The
frontend's Acquire tab calls this with `?max_value=<character.money>` so pagination only
ever contains affordable treasures. No change to `TreasureListSerializer`'s existing fields
(`id`, `name`, `value`, `photo_path`, `game_slug`) — that shape already has everything the
Acquire tab detail view needs.

### Sell-tab browsing (existing endpoint, already covered above)

The Sell tab reuses `GET games/<slug>/pcs|npcs/<character_id>/treasures.json` (now
`quantity__gt=0`-filtered, with `treasure_id`/`photo_path` added) directly — no new
endpoint.
