# GameTreasure

`GameTreasure` is the `through` model backing `Game.treasures` (the shared many-to-many
relationship between `Game` and `Treasure` — distinct from, and independent of, the separate
"exclusive" `Treasure.game` FK documented under [Treasure](treasure.md) below, which has no stock-cap
concept). It carries a per-`(game, treasure)` stock cap: a nullable `max_units` (unlimited when
`null`) and an internal `acquired_units` bookkeeping counter (starts at `0`), from which a
derived `available_units = max(max_units - acquired_units, 0)` (or `null` when `max_units` is
`null`) is computed. It also carries a required, per-`(game, treasure)` `value` — an override of
`Treasure.value` for that game, populated at creation time (for both M2M-linked and
game-exclusive treasures) and kept in sync with an exclusive treasure's own `value` on update
(see the "Update by game" row under [Treasure](treasure.md) above). It also carries a
per-`(game, treasure)` `hidden` (`BooleanField`, default `False`) — see the dedicated section
below. There is no dedicated CRUD endpoint for `GameTreasure` itself — it is only ever
read/written indirectly, through the `Treasure`/`CharacterTreasure` endpoints below.

| Action | Who can |
|--------|---------|
| Read `available_units`/`max_units`/`value` | **AllowAny**, via the game-scoped `Treasure` read endpoints — see [Treasure](treasure.md) below |
| Read `hidden` | **GameEdit** only, via `GET /games/<slug>/treasures/all.json` and the new DM-only `GET /games/<slug>/npcs/<id>/treasures/all.json` — see the `hidden` section below and [CharacterTreasure](character-treasure.md) above |
| Write `max_units` | **GameEdit**, via `PATCH /games/<slug>/treasures/<int:treasure_id>.json` when the treasure is M2M-linked to the game |
| Write `value` | Not directly editable per game — only indirectly, by a DM `PATCH`-ing an exclusive treasure's own `value` (which the endpoint mirrors onto this row); out of scope for this issue to add a DM-facing endpoint to edit `GameTreasure.value` for an M2M-linked treasure |
| Write `hidden` | **GameEdit** (or Superuser/Staff on the global `PATCH /treasures/<id>.json`, for a treasure exclusive to their own game), via `POST /games/<slug>/treasures.json` (create) and `PATCH /games/<slug>/treasures/<int:treasure_id>.json` / `PATCH /treasures/<id>.json` (update) — exclusive treasures only, same scope as `value`; the M2M-linked case has no write path (Django-admin-only), mirroring `max_units`'s own current scope before this issue |
| Write `acquired_units` | Never directly by any client — only ever incremented/decremented as a side effect of the acquire/sell endpoints above |
| Create/Delete the `(game, treasure)` link itself | Superuser only, via Django admin's `GameTreasureInline` on the `Game` admin page (no application-level endpoint) |

**Exposed fields** (read, as `available_units`/`max_units`/`value` on `TreasureListSerializer`/
`TreasureDetailSerializer`): see [Treasure](treasure.md) below for full exposure rules. `hidden`
is exposed only by `TreasureAllListSerializer` (`GET /games/<slug>/treasures/all.json`) and
`CharacterTreasureAllSerializer` (`GET /games/<slug>/npcs/<id>/treasures/all.json`) — both
DM/superuser-only siblings of the regular serializers, so `hidden` never reaches a
player-facing response.

**Write fields**: `max_units` only (`int >= 0`, or `null` for unlimited), via
`GameTreasureUpdateSerializer` — an explicit allowlist that excludes `game`, `treasure`, and
`acquired_units` — for the M2M-linked case. `hidden` (`boolean`) for the exclusive-treasure case,
handled outside any `GameTreasure`-specific serializer — see the `hidden` section below and
[Treasure](treasure.md) above.

## `hidden`

`hidden` makes a treasure's *presence in a specific game's catalog* toggleable per game, without
affecting the treasure itself or any other game it might be linked to — a treasure M2M-linked to
two games can be hidden in one and visible in the other, since each `(game, treasure)` pair has
its own `GameTreasure` row. Every treasure a game can see already has a matching `GameTreasure`
row (exclusive treasures get one created alongside them by `POST /games/<slug>/treasures.json`;
M2M-linked treasures get one created by the `Game.treasures.add(...)` call itself), so resolving
`hidden` for a `(game, treasure)` pair with no matching row (should it ever occur) defaults to
`False` rather than erroring.

`hidden` affects, per the [Treasure](treasure.md) doc above and the
[CharacterTreasure](character-treasure.md) doc above:
- `GET /games/<slug>/treasures.json` (catalog list) — excludes hidden treasures.
- `GET /games/<slug>/treasures/<int:treasure_id>.json` (catalog detail) — 404s for a non-editor.
- `POST /games/<slug>/pcs|npcs/<id>/treasures/acquire.json` — 404s when `treasure_id` resolves to
  a treasure hidden for this game (new in this issue; previously these endpoints did not check
  `hidden` at all).
- `GET /games/<slug>/npcs/<id>/treasures.json` (an NPC's own held-treasures list) — excludes any
  held treasure whose `GameTreasure.hidden` is `True` for this game (new in this issue). The PC
  equivalent (`GET /games/<slug>/pcs/<id>/treasures.json`) is deliberately **not** filtered — a
  PC keeps seeing every treasure it owns regardless of catalog visibility, per the issue.
- `POST /games/<slug>/pcs|npcs/<id>/treasures/sell.json` — unaffected; sell is scoped by
  ownership (`_find_treasure_by_id`, unfiltered by game/catalog), not catalog visibility, so a
  character can always sell a hidden treasure it already owns.

Three DM-only endpoints exist specifically to bypass the `hidden` gate above, all guarded by
`GameEditPermission.check(request, game)` (superuser, staff, or that game's GameMaster — the same
check already used by `GET /games/<slug>/treasures/all.json`):
- `GET /games/<slug>/npcs/<id>/treasures/all.json` — mirrors `GET
  /games/<slug>/npcs/<id>/treasures.json` but does not filter out hidden held treasures, and each
  item's `hidden` is exposed via `CharacterTreasureAllSerializer`.
- `POST /games/<slug>/pcs/<id>/treasures/acquire/all.json` and `POST
  /games/<slug>/npcs/<id>/treasures/acquire/all.json` — mirror the regular acquire endpoints
  (same request/response shape) but do not 404 on a hidden treasure. `GameEditPermission` is
  checked in addition to (not instead of) the `CharacterEditPermission` check already inside the
  shared acquire implementation, so a DM may act on behalf of any PC/NPC in their game even when
  that specific character's own edit rule would otherwise be narrower. The `allow_hidden` bypass
  is threaded through as an explicit function parameter (`character_treasure_acquire(...,
  allow_hidden=True)` / `character_treasures(..., allow_hidden=True)`) rather than inferred from
  `GameEditPermission` inside the shared helpers, so the regular player-facing endpoints can never
  accidentally start bypassing the gate just because the caller happens to be an editor.

**Stock-cap enforcement on acquire/sell**: when a character acquires `quantity` of a treasure
that is M2M-linked to the game with a `GameTreasure` row, the acquired amount is capped at
`available_units` instead of rejecting an over-sized request — the response's `acquired` field
reports how many units were actually granted, and `acquired_units` is incremented by that
amount. Selling decrements `acquired_units` by the sold quantity (floored at `0`). Both
operations lock the `GameTreasure` row (`select_for_update()`) inside the same transaction as
the character/`CharacterTreasure` locks, in a consistent lock order, to prevent concurrent
requests from over-selling the available stock. A treasure with `available_units == 0` is not
hidden from any list — it simply cannot be acquired further (an acquire request against it
succeeds with `acquired: 0`).

**Cost/refund calculation on acquire/sell**: the same locked `GameTreasure` row is also the
source of the per-unit `value` used to compute cost (acquire) and refund (sell) — see
[CharacterTreasure](character-treasure.md) above. When no `GameTreasure` row exists (a treasure
that is exclusive to the game with no matching row, or one a character still owns after it was
fully delisted from the game — the edge case `_find_treasure_by_id`'s docstring describes), the
calculation falls back to `Treasure.value` directly, preserving prior behavior for that edge
case.
