# CharacterTreasure

**[Game resource](principles.md#resource-categories).** A through model linking `Character` to
`Treasure`, with its own `quantity` (non-negative, default `0`) — the only through-model-with-an-
extra-field in the codebase (`Game`↔`Treasure`'s own M2M is a bare relationship). Read-only
through two index endpoints (PC, NPC), plus buy/sell and acquire/remove mutation endpoints scoped
to the owning player/GameMaster/superuser. No direct create/update/delete endpoint for a row
itself — only the atomic operations below, plus Django admin.

Deviates from the [default hidden-gated collection
pattern](principles.md#default-hidden-gated-collection-pattern) in two ways: there is no PC
`/all.json` variant (only an NPC one), and the plain PC list is never filtered by
`GameTreasure.hidden` — only the plain NPC list is.

## Index endpoints

| Endpoint | Method | Who can call |
|----------|--------|-------------|
| `/games/<slug>/pcs/<id>/treasures.json` | GET | **AllowAny** — rows with `quantity > 0` |
| `/games/<slug>/npcs/<id>/treasures.json` | GET | **AllowAny**, plus the [hidden-NPC gate](character-photo.md#hidden-npc-gate) — additionally excludes any held treasure hidden for this game (see [GameTreasure](game-treasure.md)) |
| `/games/<slug>/npcs/<id>/treasures/all.json` | GET | **GameEdit** — does not exclude hidden held treasures, adds `hidden` per item. Always `X-Skip-Cache: true` |

All three filter to `quantity__gt=0` — rows zeroed out by selling everything are kept (history,
avoids re-creation on re-acquisition) but never listed. A PC's own list is deliberately **never**
filtered by `GameTreasure.hidden` — a PC keeps seeing every treasure it owns regardless of the
catalog's current visibility; only an NPC's list is filtered, since NPCs are typically
DM-controlled and the filter exists to stop a hidden "reward" treasure from being spoiled through
the NPC's own inventory view.

## Fields
`id` (the `CharacterTreasure` row id), `treasure_id`, `name`, `value`, `photo_path` (nullable),
`quantity` — `treasure_id`/`photo_path` are not new disclosures, already public via the
`/treasures.json` family. `value` resolves via the same per-game override as
[Treasure](treasure.md) (`GameTreasure.value` when a row exists for `(game, treasure)`, else
`Treasure.value`), reflecting the per-game override rather than the character's global default.

## Treasure buy/sell endpoints

| Endpoint | Method | Who can call | Effect |
|----------|--------|-------------|--------|
| `/games/<slug>/pcs\|npcs/<character_id>/treasures/buy.json` | POST | **CharacterTreasureExchange** | Spends `quantity * value` from `character.money` to add `quantity` of `treasure_id`. `404` when the treasure is hidden for this game |
| `/games/<slug>/pcs\|npcs/<character_id>/treasures/sell.json` | POST | **CharacterTreasureExchange** | Removes `quantity`, refunding `quantity * value`. Unaffected by `hidden` — scoped by ownership, so a hidden treasure already owned can always be sold |
| `/games/<slug>/pcs\|npcs/<character_id>/treasures/buy/all.json` | POST | **GameEdit**, in addition to **CharacterTreasureExchange** | DM-only variant: does not `404` on a hidden treasure. **GameEdit** has no staff bypass, so a Staff account that isn't also superuser/DM stays `403` here even though it passes the regular endpoint's check |

Request: `{"treasure_id", "quantity" (>= 1)}`. Success (sell): `{"quantity", "money"}`. Success
(buy, both variants): same plus `acquired` (units actually acquired — may be less than requested
under a stock cap, see [GameTreasure](game-treasure.md); never a `400` even when `acquired` is
`0`). Failure: `403` on the `/all.json` variants also applies to the PC's own owning player unless
they are also DM/superuser — a Staff account gets no bypass there either, per the "no spoilers"
carve-out. `404` when `treasure_id` doesn't resolve to a treasure available in this game, or (sell)
no owned row exists. `400` `insufficient funds` on buy (checked against the capped `acquired`
amount) or `not enough owned` on sell. All operations (including `/all.json`) are atomic and never
delete the `CharacterTreasure` row even when a full sell zeroes `quantity`.

None of these endpoints re-apply the hidden-NPC `404` gate before the permission check (unlike the
read endpoints) — a hidden NPC's existence is confirmed via `401`/`403` rather than masked behind
a `404`, mirroring `PATCH /games/<slug>/npcs/<id>/full.json`.

## Treasure acquire/remove endpoints

| Endpoint | Method | Who can call | Effect |
|----------|--------|-------------|--------|
| `/games/<slug>/pcs\|npcs/<character_id>/treasures/acquire.json` | POST | **CharacterTreasureExchange** | Same as buy, except never touches `character.money` — purely narrative/DM-granted. Same `hidden` `404` gate |
| `/games/<slug>/pcs\|npcs/<character_id>/treasures/remove.json` | POST | **CharacterTreasureExchange** | Same as sell, except never touches `character.money`. Unaffected by `hidden` |
| `/games/<slug>/pcs\|npcs/<character_id>/treasures/acquire/all.json` | POST | **GameEdit**, in addition to **CharacterTreasureExchange** | DM-only variant: does not `404` on a hidden treasure. Same staff exclusion as `buy/all.json` |

Same request/response shape, permission checks, transaction semantics, and no-masking convention
as buy/sell — `money` is unchanged and still included in the response for symmetry. Success
(remove): `{"quantity", "money"}` unchanged. Success (acquire, both variants): same plus
`acquired` (no "insufficient funds" case, since money is never checked). `400` `not enough owned`
on remove only. There is no `remove/all.json` DM-bypass variant — mirroring sell having none
either, since remove is scoped by ownership rather than catalog visibility.

## `max_value` filter on the game treasure list
`/games/<slug>/treasures.json` (**AllowAny**, see [Treasure](treasure.md)) accepts an optional
`max_value` (integer, copper pieces) filter against the same per-game resolved `value`; a missing
or non-numeric value is silently ignored. `?ordering=asc|desc` sorts by the same value. The PC/NPC
treasure index endpoints above order by the same per-game value but expose no `max_value` filter
of their own — only `search`.
