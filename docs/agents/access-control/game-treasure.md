# GameTreasure

**[Game resource](principles.md#resource-categories).** `GameTreasure` is the `through` model
backing `Game.treasures` (the M2M between `Game` and `Treasure` — distinct from, and independent
of, the separate "exclusive" `Treasure.game` FK, which has no stock-cap concept). Carries a
per-`(game, treasure)` `max_units` (nullable = unlimited) and `acquired_units` counter, from which
`available_units = max(max_units - acquired_units, 0)` (or `null`) is derived; a required
per-`(game, treasure)` `value` overriding `Treasure.value` for that game; and a per-`(game,
treasure)` `hidden` (default `False`, per the [`hidden` convention](principles.md#hidden)) — see
below. No dedicated CRUD endpoint for `GameTreasure` itself — only read/written indirectly through
the `Treasure`/`CharacterTreasure` endpoints, so the [default hidden-gated collection
pattern](principles.md#default-hidden-gated-collection-pattern) doesn't apply to it directly.

| Action | Who can |
|--------|---------|
| Read `available_units`/`max_units`/`value` | **AllowAny**, via the game-scoped [Treasure](treasure.md) read endpoints |
| Read `hidden` | **GameEdit** only, via `GET /games/<slug>/treasures/all.json` and `GET /games/<slug>/npcs/<id>/treasures/all.json` |
| Write `max_units` | **GameEdit**, via `PATCH /games/<slug>/treasures/<id>.json` when M2M-linked |
| Write `value` | Not directly editable per game — only indirectly via a DM `PATCH`-ing an exclusive treasure's own `value`, which the endpoint mirrors onto this row |
| Write `hidden` | **GameEdit** (or superuser/staff on the global `PATCH /treasures/<id>.json`, for a treasure exclusive to their own game) — exclusive treasures only; the M2M-linked case has no write path (Django-admin-only) |
| Write `acquired_units` | Never directly — only as a side effect of buy/sell |
| Create/Delete the `(game, treasure)` link | Create: **GameEdit**, via `POST /games/<slug>/treasures/link.json`. Delete: superuser only, via Django admin |

`hidden` is exposed only by the two DM/superuser-only `/all.json` endpoints above — every
player-facing read endpoint omits it entirely.

## `hidden`

Makes a treasure's presence in a specific game's catalog toggleable per game, independent of the
treasure itself or any other game it's linked to. Every treasure a game can see already has a
matching `GameTreasure` row, so a missing row defaults `hidden` to `False` rather than erroring.

`hidden` gates, per [Treasure](treasure.md) and [CharacterTreasure](character-treasure.md):
- `GET /games/<slug>/treasures.json` — excludes hidden treasures.
- `GET /games/<slug>/treasures/<id>.json` — `404`s for a non-editor.
- `POST /games/<slug>/pcs\|npcs/<id>/treasures/buy.json` — `404`s when hidden for this game.
- `GET /games/<slug>/npcs/<id>/treasures.json` — excludes any held treasure hidden for this game.
  The PC equivalent is deliberately **not** filtered — a PC keeps seeing every treasure it owns
  regardless of catalog visibility.
- `POST /games/<slug>/pcs\|npcs/<id>/treasures/sell.json` — unaffected; sell is scoped by
  ownership, not catalog visibility, so a hidden treasure already owned can always be sold.

Three DM-only endpoints bypass the `hidden` gate above, all guarded by **GameEdit** (superuser,
staff, or that game's GameMaster):
- `GET /games/<slug>/npcs/<id>/treasures/all.json` — same as the regular NPC list but does not
  filter hidden held treasures, and exposes `hidden` per item.
- `POST /games/<slug>/pcs\|npcs/<id>/treasures/buy/all.json` — mirror the regular buy endpoints
  but do not `404` on a hidden treasure. **GameEdit** is checked in addition to (not instead of)
  the regular `CharacterTreasureExchange` check, so a DM may act on behalf of any PC/NPC in their
  game even when that character's own edit rule would otherwise be narrower.

The `allow_hidden` bypass is an explicit parameter threaded through the shared buy/list helpers —
never inferred from `GameEdit` — so the regular player-facing endpoints can never accidentally
bypass the gate just because the caller happens to be an editor.

## Stock-cap and cost/refund
Buying `quantity` of an M2M-linked treasure caps the acquired amount at `available_units` instead
of rejecting an over-sized request — the response's `acquired` field reports how many units were
actually granted, and `acquired_units` increments by that amount; selling decrements it (floored at
`0`). Both lock the `GameTreasure` row for the duration of the same transaction as the
character/`CharacterTreasure` locks, in a consistent order, to prevent over-selling under
concurrency. A treasure with `available_units == 0` is not hidden from any list — it simply cannot
be bought further (succeeds with `acquired: 0`).

The same locked row is the source of the per-unit `value` used to compute buy cost / sell refund
(see [CharacterTreasure](character-treasure.md)). When no `GameTreasure` row exists (an edge case
described in the code), the calculation falls back to `Treasure.value` directly.
