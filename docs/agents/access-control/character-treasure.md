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
| `/games/<slug>/npcs/<id>/treasures.json` | GET | **AllowAny**, but see [hidden-NPC gate](character-photo.md#photo-index-endpoints) above | Same as above, for that NPC, additionally excluding any held treasure whose `GameTreasure.hidden` (see [GameTreasure](game-treasure.md) above) is `True` for this game |
| `/games/<slug>/npcs/<id>/treasures/all.json` | GET | **GameEdit** | DM-only variant of the NPC endpoint above: does not exclude hidden held treasures, and each item's `hidden` is additionally exposed via `CharacterTreasureAllSerializer` (a `CharacterTreasureSerializer` subclass used only by this endpoint). Always sets `X-Skip-Cache: true` |

Unknown `game_slug` or `character_id` (or mismatched/wrong type) → 404. All three endpoints filter
to `quantity__gt=0` — rows zeroed out by selling all owned units are kept in the database (to
preserve history and avoid re-creating the row on re-acquisition) but never listed. The
hidden-NPC gate from [CharacterPhoto](character-photo.md) above applies identically to
`game_npc_treasures`/`game_npc_treasures_all`. A PC's own list (`game_pc_treasures`) is
deliberately never filtered by `GameTreasure.hidden` — a PC keeps seeing every treasure it owns
regardless of the catalog's current visibility for it, per the issue that introduced the NPC-side
filter; only an NPC's held-treasures list is filtered, since NPCs are typically DM-controlled and
the filter exists to stop a hidden "reward" treasure from being spoiled through the NPC's own
inventory view.

**Exposed fields** (read): `id` (the `CharacterTreasure` row id, not the `Treasure` id),
`treasure_id`, `name`, `value`, `photo_path` (from the related `Treasure`; nullable), `quantity`
(the through model's own field) — all non-sensitive; `treasure_id` and `photo_path` are not new
disclosures, since both are already publicly exposed for the same `Treasure` via
`/treasures.json`, `/treasures/<id>.json`, and `/games/<slug>/treasures.json`.

`value` resolves via the same `resolve_treasure_value` helper used by `TreasureListSerializer`/
`TreasureDetailSerializer` (see [Treasure](treasure.md) above): the owning game's `GameTreasure`
row's `value` when one exists for `(game, treasure)`, falling back to `Treasure.value` otherwise.
Both index endpoints pass `game_treasures_context(game)` into the serializer, so `value` reflects
the per-game override in normal use — not the character's held treasure's global default.

## Treasure acquire/sell endpoints

| Endpoint | Method | Who can call | Effect |
|----------|--------|-------------|--------|
| `/games/<slug>/pcs/<character_id>/treasures/acquire.json` | POST | **CharacterEdit** | Spends `quantity * value` from `character.money` to add `quantity` of `treasure_id`, where `value` is the game's `GameTreasure.value` when a `GameTreasure` row exists for `(game, treasure)`, else `treasure.value`. 404s when `treasure_id` resolves to a treasure whose `GameTreasure.hidden` is `True` for this game (see [GameTreasure](game-treasure.md) above) |
| `/games/<slug>/pcs/<character_id>/treasures/sell.json` | POST | **CharacterEdit** | Removes `quantity` of `treasure_id`, refunding `quantity * value` into `character.money` (same `GameTreasure.value`-or-`treasure.value` resolution as acquire). Unaffected by `hidden` — scoped by ownership, not catalog visibility, so a hidden treasure a character already owns can always be sold |
| `/games/<slug>/npcs/<character_id>/treasures/acquire.json` | POST | **CharacterEdit** (note: *not* NpcPlayerEdit, unlike NPC photo uploads) | Same as the PC acquire endpoint, for an NPC, including the same `hidden` 404 gate |
| `/games/<slug>/npcs/<character_id>/treasures/sell.json` | POST | **CharacterEdit** | Same as the PC sell endpoint, for an NPC |
| `/games/<slug>/pcs/<character_id>/treasures/acquire/all.json` | POST | **GameEdit**, in addition to **CharacterEdit** | DM-only variant of the PC acquire endpoint: same request/response shape, but does not 404 on a hidden treasure |
| `/games/<slug>/npcs/<character_id>/treasures/acquire/all.json` | POST | **GameEdit**, in addition to **CharacterEdit** | DM-only variant of the NPC acquire endpoint: same request/response shape, but does not 404 on a hidden treasure |

Request body: `{"treasure_id": <int>, "quantity": <int, >= 1>}`. Success (200) for sell:
`{"quantity": <new owned quantity>, "money": <new character.money>}`. Success (200) for acquire
(both the regular and `/all.json` variants): same two fields plus `acquired` — the number of
units actually acquired, which may be less than requested when the treasure has a stock cap and
fewer units are available (partial fulfillment — see [GameTreasure](game-treasure.md) below;
never a 400, even when `acquired` is `0`).

Failure: 401, 403 (not the owning player/GameMaster/superuser — or, for the two `/all.json`
variants, not `GameEditPermission`-authorized, checked in addition to and independently of the
regular `CharacterEditPermission` check inside the shared acquire implementation, so even the
PC's own owning player gets 403 on the `/all.json` route unless they are also that game's
GameMaster or a superuser/staff), 404 (`treasure_id` does not resolve to a treasure available in
this game — scoped via the same `Q(linked_game=game) | Q(game=game)` filter used by the game
treasure list, and (regular acquire only) hidden for this game — or, for sell, no owned
`CharacterTreasure` row exists), 400 (`{"errors": {"quantity": ["insufficient funds"]}}` on
acquire when `acquired * value > character.money` — checked against the capped `acquired` amount,
not the requested `quantity`, using the same `GameTreasure.value`-or-`treasure.value` resolution
described above — or `{"errors": {"quantity": ["not enough owned"]}}` on sell). All acquire/sell
operations (including `/all.json`) run inside `transaction.atomic()` and never delete the
`CharacterTreasure` row, even when a full sell brings `quantity` to `0`.

None of these endpoints re-apply the hidden-NPC `Http404` gate before the permission check (unlike
the read endpoints above) — a hidden NPC's existence is confirmed via 401/403 rather than masked
behind a 404, mirroring the same no-masking convention used by
`PATCH /games/<slug>/npcs/<id>/full.json`.

The `allow_hidden` bypass used by the two `/all.json` acquire endpoints (and the NPC
`/treasures/all.json` list endpoint above) is an explicit function parameter threaded through
`character_treasure_acquire`/`_find_game_treasure`/`character_treasures` — never inferred from
`GameEditPermission` inside those shared helpers — so the regular, player-facing endpoints can
never accidentally start bypassing the `hidden` gate just because the caller happens to also be
an editor of the game.

## `max_value` filter on the game treasure list

`/games/<slug>/treasures.json` (GET, **AllowAny**, documented under [Treasure](treasure.md) below) accepts an
optional `max_value` query parameter (integer, copper pieces): the queryset is annotated with the
same per-game `game_value` (`GameTreasure.value`, falling back to `Treasure.value` — see
[Treasure](treasure.md) above) used for display, and filtered to `game_value__lte=max_value`; a
missing or non-numeric value is silently ignored. Ordering (`?ordering=asc|desc`) on this same
endpoint sorts by that same `game_value` annotation. Exposes no additional data — it only
narrows/reorders the same publicly readable list.

The PC/NPC treasure index endpoints above order by the same per-game value (via a `Coalesce`+
`Subquery` annotation rather than a plain `treasure__value` order, since a character's treasures
can span games' overrides) but do not expose a `max_value` filter of their own — only `search`.
