# Backend Plan: Add max units treasure

Main plan: [plan.md](plan.md)

## Shared contracts

- Own the new `GameTreasure` through model (`game`, `treasure`, `max_units` nullable, `acquired_units`
  default `0`) backing `Game.treasures`.
- Own `TreasureListSerializer`'s new `available_units`/`max_units` fields, computed from a `game`
  passed via serializer `context`. `paginated_list_response` gains an optional `context` param.
  When no `game` is in context (global `/treasures.json`), both fields must serialize as `null`.
- Own the acquire endpoint's new `acquired` response field (units actually acquired in this
  request, may be less than the requested `quantity` when capped by availability). Existing
  `quantity` (character's new total owned) and `money` fields are unchanged.
- Own extending `game_treasure_detail.py` / `TreasureUpdateSerializer` (or an adjacent serializer)
  so `max_units` becomes editable for M2M-linked treasures via `PATCH /games/<slug>/treasures/<id>.json`.
  Frontend's `GameTreasureEditController`/`GameTreasureEditHelper` will add a form field once this
  is in place — see `frontend.md`.

## Implementation Steps

### Step 1 — `GameTreasure` through model

Create `source/games/models/game_treasure.py`, modeled after the existing `CharacterTreasure`
(`source/games/models/character_treasure.py`) and `GameMaster`
(`source/games/models/game_master.py`) patterns:

```python
class GameTreasure(models.Model):
    game = models.ForeignKey('games.Game', on_delete=models.CASCADE, related_name='game_treasures')
    treasure = models.ForeignKey('games.Treasure', on_delete=models.CASCADE, related_name='game_treasures')
    max_units = models.PositiveIntegerField(null=True, blank=True)
    acquired_units = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['id']
        unique_together = [('game', 'treasure')]
```

Add an `available_units` property/method on the model (or a small helper) returning
`None if max_units is None else max(max_units - acquired_units, 0)` — reused by both the
serializer and the acquire/sell logic, so the "available" computation lives in one place.

Register in `source/games/models/__init__.py` / `__all__`, matching the existing alphabetical
ordering convention.

### Step 2 — Convert `Game.treasures` to use the through model

In `source/games/models/game.py`, change:

```python
treasures = models.ManyToManyField(
    'Treasure', blank=True, related_name='linked_games', related_query_name='linked_game',
)
```

to:

```python
treasures = models.ManyToManyField(
    'Treasure', through='GameTreasure', blank=True,
    related_name='linked_games', related_query_name='linked_game',
)
```

Generate the migration (`0037_...`) — this both creates `GameTreasure` and alters the M2M's
`through`. Since there is currently no application code creating these links (see Notes in
`plan.md`), no data migration should be needed, but double-check any fixtures/seed data under
`source/` that might populate `Game.treasures` directly and would need updating to go through
the new model instead.

### Step 3 — Admin

`source/games/admin.py` currently relies on the default auto-generated M2M widget for
`Game.treasures` (no explicit `GameTreasureInline` today). Once `through=GameTreasure` is set,
Django's admin can no longer render that default widget. Add a `TabularInline` for
`GameTreasure` (fields: `treasure`, `max_units`, read-only `acquired_units`) and attach it to
the `Game` admin (registering an explicit `GameAdmin(admin.ModelAdmin)` with
`inlines = [GameTreasureInline]`, replacing the current bare `admin.site.register(Game)`).

### Step 4 — Acquire/sell logic

In `source/games/views/characters/_treasure_exchange.py`:

- `_acquire`: when the treasure is linked to the game via the M2M (i.e. a `GameTreasure` row
  exists for `(game, treasure)`), lock that row (`select_for_update()`) alongside the character
  lock, compute `available = GameTreasure.available_units` (or `None` for unlimited / no
  through-row for exclusive treasures), and cap the acquired quantity at `min(quantity,
  available)` when `available is not None`. If the capped quantity is `0`, still respond
  successfully with `acquired: 0` (not a 400) — per the issue, over-requesting is a partial
  fulfillment, not a rejection; only reaching `0` when the item was already fully depleted before
  the request should behave this way (there is no "insufficient stock" error case per the
  issue — only "insufficient funds" remains a hard error). Charge only for the units actually
  acquired. Increment `acquired_units` on the through-row by the acquired amount.
  - Note: `_acquire` needs the `game` to look up the `GameTreasure` row — check whether `game`
    is already available in this call chain (`character_treasure_acquire`/`character_treasure_sell`
    already receive `game`) and thread it through to `_acquire`/`_sell` if not already passed.
- `_sell`: decrement `acquired_units` by the sold quantity when a `GameTreasure` row exists for
  `(game, treasure)` (mirroring the acquire increment); no cap needed on sell beyond the existing
  "not enough owned" check.
- Response for `_acquire` gains `acquired` (see Shared contracts above); `_sell`'s response shape
  is unchanged.

### Step 5 — Serializers

- `TreasureListSerializer` (`source/games/serializers/treasure_list.py`): add
  `available_units`/`max_units` as `SerializerMethodField`s reading `self.context.get('game')`
  and looking up the `GameTreasure` row for `(game, treasure)` — return `None` when there's no
  `game` in context, no matching `GameTreasure` row (exclusive treasure), or `max_units` is
  `None`. Watch N+1 queries: since this serializer is used in paginated lists, prefetch the
  relevant `GameTreasure` rows in the calling views (Step 6) rather than querying per-item.
- Extend `game_treasure_detail.py`'s update path (or introduce a small dedicated serializer) to
  accept `max_units` when the resolved treasure is M2M-linked to the game rather than exclusive
  — see Step 6.

### Step 6 — Views

- `game_treasures.py` / `game_treasures_all.py`: pass `context={'game': game}` into
  `paginated_list_response`, and extend `paginated_list_response`
  (`source/games/views/common.py`) to accept an optional `context` dict forwarded to the
  serializer constructor (default `None`/`{}` to keep existing callers unchanged). Prefetch
  `GameTreasure` rows for the page's treasures (e.g. via `Prefetch` or a
  `{treasure_id: game_treasure}` dict built once and passed through context) to avoid N+1 queries
  from Step 5.
- `game_treasure_detail.py`: change the `get_object_or_404` lookup from
  `Treasure.objects.get(id=treasure_id, game=game)` to also match M2M-linked treasures
  (`Q(game=game) | Q(linked_game=game)`, matching the pattern already used in
  `_treasure_exchange.py`/`game_treasures.py`). In `_update_game_treasure`, branch: if the
  treasure is exclusive to the game (`treasure.game_id == game.id`), keep the current
  `TreasureUpdateSerializer` behavior (`name`/`value`/`hidden`); if it's M2M-linked instead,
  additionally accept and persist `max_units` onto that `GameTreasure` row (validate it's a
  non-negative integer or `null`). Keep `acquired_units` never directly settable through this
  endpoint.

### Step 7 — Tests

Follow existing test structure/conventions under `source/games/tests/`:
- `tests/models/test_game_treasure.py` — new model, `available_units` computation, `unique_together`.
- `tests/models/test_game.py` (if it exists) or wherever `Game.treasures` is covered — through-model wiring.
- `tests/serializers/test_treasure_list.py` — `available_units`/`max_units` presence/absence per context.
- `tests/views/characters/game_character_treasure_acquire_test.py` and
  `game_character_treasure_sell_test.py` — partial fulfillment, `acquired_units` bookkeeping,
  `acquired` response field, 0-available-still-listed behavior.
- `tests/views/games/game_treasures_test.py`, `game_treasures_all_test.py`,
  `game_treasure_detail_test.py` — serialized fields and the new PATCH path for M2M-linked
  treasures.

## Files to Change

- `source/games/models/game_treasure.py` — new `GameTreasure` through model
- `source/games/models/__init__.py` — register `GameTreasure`
- `source/games/models/game.py` — `treasures` M2M gains `through='GameTreasure'`
- `source/games/migrations/00XX_*.py` — new migration for the through model / M2M change
- `source/games/admin.py` — `GameTreasureInline` on `GameAdmin`
- `source/games/views/characters/_treasure_exchange.py` — acquire/sell cap logic, `acquired` field
- `source/games/serializers/treasure_list.py` — `available_units`/`max_units` fields
- `source/games/serializers/treasure_update.py` (or new serializer) — `max_units` editing support
- `source/games/views/common.py` — `paginated_list_response` optional `context` param
- `source/games/views/games/game_treasures.py` — pass `game` context
- `source/games/views/games/game_treasures_all.py` — pass `game` context
- `source/games/views/games/game_treasure_detail.py` — resolve M2M-linked treasures, accept `max_units`
- Corresponding new/updated test files under `source/games/tests/` (see Step 7)

## CI Checks

- `source/`: `docker-compose run --rm majora_tests pytest --cov`
- `source/`: `docker-compose run --rm majora_tests ruff check .`

## Notes

- Watch for N+1 queries introduced by per-item `GameTreasure` lookups in the list serializer —
  prefetch/batch-load per page instead.
- After this work lands, the coordinator will invoke `data-access` (serializer field changes on
  an existing endpoint) and `security` (new editable `max_units` input) before the PR is opened.
- `Treasure.can_be_edited_by` / `Game.can_be_edited_by` permission logic is unchanged by this
  issue — only the acquire/sell quantity math and list serialization gain the new fields.
