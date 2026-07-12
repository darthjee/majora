# GameTreasure

`GameTreasure` is the `through` model backing `Game.treasures` (the shared many-to-many
relationship between `Game` and `Treasure` — distinct from, and independent of, the separate
"exclusive" `Treasure.game` FK documented under [Treasure](treasure.md) below, which has no stock-cap
concept). It carries a per-`(game, treasure)` stock cap: a nullable `max_units` (unlimited when
`null`) and an internal `acquired_units` bookkeeping counter (starts at `0`), from which a
derived `available_units = max(max_units - acquired_units, 0)` (or `null` when `max_units` is
`null`) is computed. There is no dedicated CRUD endpoint for `GameTreasure` itself — it is only
ever read/written indirectly, through the `Treasure` endpoints below.

| Action | Who can |
|--------|---------|
| Read `available_units`/`max_units` | **AllowAny**, via the game-scoped `Treasure` read endpoints — see [Treasure](treasure.md) below |
| Write `max_units` | **GameEdit**, via `PATCH /games/<slug>/treasures/<int:treasure_id>.json` when the treasure is M2M-linked to the game |
| Write `acquired_units` | Never directly by any client — only ever incremented/decremented as a side effect of the acquire/sell endpoints above |
| Create/Delete the `(game, treasure)` link itself | Superuser only, via Django admin's `GameTreasureInline` on the `Game` admin page (no application-level endpoint) |

**Exposed fields** (read, as `available_units`/`max_units` on `TreasureListSerializer`/
`TreasureDetailSerializer`): see [Treasure](treasure.md) below for full exposure rules.

**Write fields**: `max_units` only (`int >= 0`, or `null` for unlimited), via
`GameTreasureUpdateSerializer` — an explicit allowlist that excludes `game`, `treasure`, and
`acquired_units`.

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
