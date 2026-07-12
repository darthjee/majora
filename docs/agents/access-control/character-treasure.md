# CharacterTreasure

`CharacterTreasure` is a through model linking `Character` to `Treasure`, with its own
`quantity` (non-negative integer, default `0`) — the first through-model-with-an-extra-field in
the codebase (the `Game`↔`Treasure` M2M is a bare relationship with no through model or extra
fields). It is read-only through two dedicated index endpoints (one for PCs, one for NPCs), plus
four acquire/sell mutation endpoints scoped to the owning player/GameMaster/superuser. There is
no direct create/update/delete endpoint for a `CharacterTreasure` row itself — only the atomic
acquire/sell operations below, plus Django admin for superusers.

## Treasure index endpoints

| Endpoint | Method | Who can call | Response |
|----------|--------|-------------|----------|
| `/games/<slug>/pcs/<id>/treasures.json` | GET | **AllowAny** | Paginated list of `CharacterTreasureSerializer` objects (`id`, `treasure_id`, `name`, `quantity`, `value`, `photo_path`) for that PC's `CharacterTreasure` rows with `quantity > 0` |
| `/games/<slug>/npcs/<id>/treasures.json` | GET | **AllowAny**, but see [hidden-NPC gate](character-photo.md#photo-index-endpoints) above | Same as above, for that NPC |

Unknown `game_slug` or `character_id` (or mismatched/wrong type) → 404. Both endpoints filter to
`quantity__gt=0` — rows zeroed out by selling all owned units are kept in the database (to
preserve history and avoid re-creating the row on re-acquisition) but never listed. The
hidden-NPC gate from [CharacterPhoto](character-photo.md) above applies identically to `game_npc_treasures`.

**Exposed fields** (read): `id` (the `CharacterTreasure` row id, not the `Treasure` id),
`treasure_id`, `name`, `value`, `photo_path` (from the related `Treasure`; nullable), `quantity`
(the through model's own field) — all non-sensitive; `treasure_id` and `photo_path` are not new
disclosures, since both are already publicly exposed for the same `Treasure` via
`/treasures.json`, `/treasures/<id>.json`, and `/games/<slug>/treasures.json`.

## Treasure acquire/sell endpoints

| Endpoint | Method | Who can call | Effect |
|----------|--------|-------------|--------|
| `/games/<slug>/pcs/<character_id>/treasures/acquire.json` | POST | **CharacterEdit** | Spends `quantity * treasure.value` from `character.money` to add `quantity` of `treasure_id` |
| `/games/<slug>/pcs/<character_id>/treasures/sell.json` | POST | **CharacterEdit** | Removes `quantity` of `treasure_id`, refunding `quantity * treasure.value` into `character.money` |
| `/games/<slug>/npcs/<character_id>/treasures/acquire.json` | POST | **CharacterEdit** (note: *not* NpcPlayerEdit, unlike NPC photo uploads) | Same as the PC acquire endpoint, for an NPC |
| `/games/<slug>/npcs/<character_id>/treasures/sell.json` | POST | **CharacterEdit** | Same as the PC sell endpoint, for an NPC |

Request body: `{"treasure_id": <int>, "quantity": <int, >= 1>}`. Success (200) for sell:
`{"quantity": <new owned quantity>, "money": <new character.money>}`. Success (200) for acquire:
same two fields plus `acquired` — the number of units actually acquired, which may be less than
requested when the treasure has a stock cap and fewer units are available (partial fulfillment —
see [GameTreasure](game-treasure.md) below; never a 400, even when `acquired` is `0`).

Failure: 401, 403 (not the owning player/GameMaster/superuser), 404 (`treasure_id` does not
resolve to a treasure available in this game — scoped via the same
`Q(linked_game=game) | Q(game=game)` filter used by the game treasure list — or, for sell, no
owned `CharacterTreasure` row exists), 400 (`{"errors": {"quantity": ["insufficient funds"]}}`
on acquire when `acquired * treasure.value > character.money` — checked against the capped
`acquired` amount, not the requested `quantity` — or `{"errors": {"quantity": ["not enough
owned"]}}` on sell). Both operations run inside `transaction.atomic()` and never delete the
`CharacterTreasure` row, even when a full sell brings `quantity` to `0`.

These endpoints do not re-apply the hidden-NPC `Http404` gate before the permission check
(unlike the read endpoint above) — a hidden NPC's existence is confirmed via 401/403 rather than
masked behind a 404, mirroring the same no-masking convention used by
`PATCH /games/<slug>/npcs/<id>/full.json`.

## `max_value` filter on the game treasure list

`/games/<slug>/treasures.json` (GET, **AllowAny**, documented under [Treasure](treasure.md) below) accepts an
optional `max_value` query parameter (integer, copper pieces): the queryset is filtered to
`value__lte=max_value`; a missing or non-numeric value is silently ignored. Exposes no
additional data — it only narrows the same publicly readable list.
