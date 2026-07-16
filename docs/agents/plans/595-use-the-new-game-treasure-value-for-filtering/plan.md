# Plan: Use the new game treasure value for filtering

Issue: [595-use-the-new-game-treasure-value-for-filtering.md](../../issues/595-use-the-new-game-treasure-value-for-filtering.md)

## Overview

`GameTreasure.value` already exists in the database (added and backfilled by migrations
`0055_gametreasure_value`/`0056_alter_gametreasure_value_not_null`, and populated at creation
time for both M2M-linked and game-exclusive treasures), but every read, filter, ordering, and
cost-calculation path still reads `Treasure.value` instead. This plan switches all of those paths
to `GameTreasure.value` — falling back to `Treasure.value` only where no per-game row applies
(the global, non-game-scoped catalogue) — and fixes a consistency gap this change would otherwise
introduce: updating a game-exclusive treasure's value currently only touches `Treasure.value`,
which would silently desync from its own `GameTreasure.value` row once display starts reading the
latter. Entirely within the `backend` agent's scope; no frontend or other agent has work here.

## Context

- `Treasure.value` (`games/models/treasure/treasure.py:11`) is the historical, global default
  value.
- `GameTreasure.value` (`games/models/game/game_treasure.py:16`) is a required, per-`(game,
  treasure)` override — created alongside every new exclusive treasure
  (`games/views/games/game_treasures.py:86`) and, for pre-existing rows, backfilled by
  `0055_gametreasure_value.py` for both M2M-linked and exclusive treasures. So every treasure a
  game can see already has a matching `GameTreasure` row *unless* the read path has no `game` in
  context at all (the global `/treasures.json` catalogue).
- `GameTreasureFieldsMixin` (`games/serializers/games/treasures/game_treasure_fields.py`) already
  resolves the per-game `GameTreasure` row for `available_units`/`max_units`, using either a
  prefetched dict (`context['game_treasures_by_treasure_id']`, built once per request by
  `game_treasures_context()` in `games/views/games/_treasure_context.py`) or a direct query when
  no prefetch is available. This is the pattern to extend to `value`.

## Implementation Steps

### Step 1 — Extract a shared value-resolution helper

In `games/serializers/games/treasures/game_treasure_fields.py`, extract two module-level
functions above the mixin class (so both the mixin and `CharacterTreasureSerializer`, in Step 3,
can reuse them without duplicating the fallback logic):

```python
def resolve_game_treasure(context, treasure):
    """Return the GameTreasure row linking `treasure` to the context game, or None."""
    game = context.get('game')
    if game is None:
        return None
    prefetched = context.get('game_treasures_by_treasure_id')
    if prefetched is not None:
        return prefetched.get(treasure.id)
    return GameTreasure.objects.filter(game=game, treasure=treasure).first()


def resolve_treasure_value(context, treasure):
    """Return `treasure`'s value in the context game, falling back to its default value."""
    game_treasure = resolve_game_treasure(context, treasure)
    return treasure.value if game_treasure is None else game_treasure.value
```

Update `GameTreasureFieldsMixin._game_treasure` to just delegate to `resolve_game_treasure(self.context, treasure)` (keep the method for backward call-site compatibility, or inline-replace its two call sites — either is fine as long as behavior is unchanged).

### Step 2 — Add `value` to `GameTreasureFieldsMixin`

In the same file, add to `GameTreasureFieldsMixin`:

```python
value = serializers.SerializerMethodField()

def get_value(self, treasure):
    """Return the treasure's value in the context game, falling back to its default value."""
    return resolve_treasure_value(self.context, treasure)
```

Because `GameTreasureFieldsMixin` is listed first in `TreasureListSerializer`/
`TreasureDetailSerializer`'s base classes, this explicitly-declared `value` field overrides the
implicit `ModelSerializer`-generated one — no changes needed in `treasure_list.py` or
`treasure_detail.py` themselves, `'value'` stays in their `Meta.fields` unchanged.

This also fixes `GET /games/:game_slug/treasures/all.json` (`game_treasures_all.py`, not
explicitly listed in the issue but sharing the same serializer + context) for free.

### Step 3 — Switch `CharacterTreasureSerializer` to the same resolution

`CharacterTreasureSerializer` (`games/serializers/characters/character_treasure.py`) serializes
`CharacterTreasure` instances, not `Treasure` instances directly, so it can't inherit
`GameTreasureFieldsMixin` as-is. Instead:

```python
from games.serializers.games.treasures.game_treasure_fields import resolve_treasure_value
...
value = serializers.SerializerMethodField()

def get_value(self, character_treasure):
    """Return the held treasure's value in the context game, falling back to its default."""
    return resolve_treasure_value(self.context, character_treasure.treasure)
```

removing the old `value = serializers.IntegerField(source='treasure.value', read_only=True)`
declaration.

### Step 4 — Pass game context into the PC/NPC treasure list endpoint

In `games/views/game/_treasures.py`, `character_treasures()` currently calls
`paginated_list_response(request, treasures, CharacterTreasureSerializer)` with no context, so
`resolve_treasure_value` would always fall back to `treasure.value`. Reuse the existing
`game_treasures_context(game)` helper (already imported by `game_treasures.py`/
`game_treasures_all.py`):

```python
from ..games._treasure_context import game_treasures_context
...
context = game_treasures_context(game)
response = paginated_list_response(request, treasures, CharacterTreasureSerializer, context=context)
```

Note `game_treasures_context` keys its prefetch dict by `treasure_id`, matching
`character_treasure.treasure.id` — no changes needed there.

### Step 5 — Order the PC/NPC treasure list by `GameTreasure.value`

Still in `_treasures.py`, replace the `order_by('treasure__value', 'treasure__id')` (line 23)
with a DB-level per-game value using `Coalesce`+`Subquery` (a plain `treasure__value` order
can't reach a different game's override):

```python
from django.db.models import IntegerField, OuterRef, Subquery
from django.db.models.functions import Coalesce

from ...models import GameTreasure
...
game_value = Subquery(
    GameTreasure.objects.filter(game=game, treasure=OuterRef('treasure_id')).values('value')[:1],
    output_field=IntegerField(),
)
treasures = treasures.annotate(game_value=Coalesce(game_value, 'treasure__value'))
treasures = treasures.order_by('game_value', 'treasure__id')
```

Per the confirmed scope for this issue, do **not** add a new value-filter query param to this
endpoint (only display + ordering change here) — the PC/NPC endpoints keep only their existing
`search` filter.

### Step 6 — Filter and order the game-level treasure list by `GameTreasure.value`

In `games/views/games/game_treasures.py`, annotate the queryset the same way right after it's
built (before `_filter_by_max_value`/`_filter_by_search`/`_apply_ordering` run), then switch both
helpers to use the annotation:

```python
game_value = Subquery(
    GameTreasure.objects.filter(game=game, treasure=OuterRef('pk')).values('value')[:1],
    output_field=IntegerField(),
)
treasures = treasures.annotate(game_value=Coalesce(game_value, 'value'))
```

- `_filter_by_max_value`: change `treasures.filter(value__lte=max_value)` to
  `treasures.filter(game_value__lte=max_value)`.
- `_apply_ordering`: change `order_by('-value', 'id')`/`order_by('value', 'id')` to
  `order_by('-game_value', 'id')`/`order_by('game_value', 'id')`.

(Needs `from django.db.models import IntegerField, OuterRef, Subquery` and
`from django.db.models.functions import Coalesce` added to this file's imports.)

### Step 7 — Use `GameTreasure.value` in acquire/sell cost calculation

In `games/views/game/_treasure_exchange.py`:

- `_acquire` (line ~91-116): `game_treasure = _lock_game_treasure(game, treasure)` is already
  fetched at line 99, just unused for value. Change line 101:
  `cost = acquired * (treasure.value if game_treasure is None else game_treasure.value)`.
- `_sell` (line ~134-153): currently computes the refund (line 148) *before* looking up
  `game_treasure` (line 151, only for the release call). Reorder so the lookup happens first and
  is reused for both the value and the release:

```python
def _sell(character, treasure, quantity, game):
    """Atomically remove `quantity` of `treasure` from `character`, refunding their value."""
    with transaction.atomic():
        character = _lock_character(character)
        character_treasure = _lock_character_treasure(character, treasure)
        if character_treasure is None:
            raise Http404

        if quantity > character_treasure.quantity:
            return Response({'errors': {'quantity': ['not enough owned']}}, status=400)

        character_treasure.quantity -= quantity
        character_treasure.save()

        game_treasure = _lock_game_treasure(game, treasure)
        value = treasure.value if game_treasure is None else game_treasure.value
        character.money += quantity * value
        character.save()

        _release_acquired_units(game_treasure, quantity)

    return Response({'quantity': character_treasure.quantity, 'money': character.money})
```

`game_treasure` will be `None` here only for a treasure a character still owns after it was fully
delisted from the game (the pre-existing edge case `_find_treasure_by_id`'s docstring already
describes) — falling back to `treasure.value` there preserves current behavior for that edge case.

### Step 8 — Keep an exclusive treasure's `GameTreasure.value` in sync on update

Not named in the issue's endpoint list, but required for the issue's own goal: a game-exclusive
treasure's value is edited via `PATCH /games/:game_slug/treasures/:treasure_id.json` →
`_update_exclusive_treasure` in `games/views/games/game_treasure_detail.py`, which today only
updates `Treasure.value` via `TreasureUpdateSerializer`. Once display reads `GameTreasure.value`,
an edit here would silently stop showing up unless the matching `GameTreasure` row (guaranteed to
exist, per Context above) is updated too:

```python
def _update_game_treasure(request, game, treasure):
    """Validate permission and payload, persist the update, then return the detail Response."""
    error_response = GameEditPermission.check(request, game)
    if error_response:
        return error_response

    if treasure.game_id == game.id:
        return _update_exclusive_treasure(request, game, treasure)
    return _update_linked_treasure(request, game, treasure)


def _update_exclusive_treasure(request, game, treasure):
    """Update name/value/hidden on the exclusive treasure, mirroring value onto its GameTreasure."""
    serializer = TreasureUpdateSerializer(treasure, data=request.data, partial=True)
    error_response = validated_or_error(serializer)
    if error_response:
        return error_response

    serializer.save()
    GameTreasure.objects.filter(game=game, treasure=treasure).update(value=treasure.value)
    return Response(TreasureDetailSerializer(treasure, context={'game': game}).data)
```

(`_update_exclusive_treasure` gains a `game` parameter; its caller is updated accordingly. Also
note the returned `TreasureDetailSerializer` now gets `context={'game': game}` instead of no
context, for consistency with the other detail responses in this file — harmless either way since
the two values are now kept in sync, but avoids relying on that sync implicitly.)

## Files to Change

- `games/serializers/games/treasures/game_treasure_fields.py` — extract `resolve_game_treasure`/
  `resolve_treasure_value`, add `value` field to `GameTreasureFieldsMixin`.
- `games/serializers/characters/character_treasure.py` — switch `value` to a
  `SerializerMethodField` using `resolve_treasure_value`.
- `games/views/game/_treasures.py` — pass game context into the serializer, switch ordering to
  the annotated per-game value.
- `games/views/games/game_treasures.py` — annotate the queryset, switch `_filter_by_max_value`/
  `_apply_ordering` to the annotated per-game value.
- `games/views/game/_treasure_exchange.py` — use `GameTreasure.value` in `_acquire`/`_sell` cost
  calculation.
- `games/views/games/game_treasure_detail.py` — sync an exclusive treasure's `GameTreasure.value`
  on update; thread `game` into `_update_exclusive_treasure`.
- `games/tests/serializers/treasures/treasure_list_test.py`,
  `games/tests/serializers/treasures/treasure_detail_test.py` — cover `value` resolving from
  `GameTreasure` when in context, and falling back to `Treasure.value` without it.
- `games/tests/serializers/characters/character_treasure_test.py` — same coverage for
  `CharacterTreasureSerializer`.
- `games/tests/views/games/game_treasures_test.py` — update/add coverage for `max_value` and
  `ordering` operating on `GameTreasure.value`.
- `games/tests/views/games/game_treasure_detail_test.py` — cover the new value-sync-on-update
  behavior for exclusive treasures.
- `games/tests/views/game/pcs/detail/treasures/game_pc_treasures_test.py`,
  `games/tests/views/game/npcs/detail/treasures/game_npc_treasures_test.py` — cover value/ordering
  reflecting `GameTreasure.value`.
- `games/tests/views/game/pcs/detail/treasures/game_pc_treasure_acquire_test.py`,
  `game_pc_treasure_sell_test.py`, and the NPC equivalents — cover cost/refund using
  `GameTreasure.value` when it differs from `Treasure.value`.
- `docs/agents/access-control/treasure.md`, `docs/agents/access-control/character-treasure.md`,
  `docs/agents/access-control/game-treasure.md` — update `value`/exchange-cost descriptions from
  `Treasure.value` to the `GameTreasure.value` resolution rule (mirroring how `available_units`/
  `max_units` are already documented), and document the new sync-on-update behavior in
  `treasure.md`'s "Update by game" row.

## CI Checks

- `backend`: `poetry run pytest games/tests/views/game/` (CI job: `pytest_views_characters`) —
  covers the PC/NPC treasures list and acquire/sell tests.
- `backend`: `poetry run pytest games/tests/views/ --ignore=games/tests/views/game/` (CI job:
  `pytest_views_rest`) — covers `game_treasures_test.py`/`game_treasure_detail_test.py`.
- `backend`: `poetry run pytest --ignore=games/tests/views/` (CI job: `pytest_all`) — covers the
  serializer-level tests.
- `backend`: `poetry run ruff check .` and `bin/reports.sh ci` (CI job: `checks`) — lint and
  complexity.

## Notes

- Step 8 (syncing `GameTreasure.value` on exclusive-treasure update) is not one of the issue's
  named endpoints but is required for the feature to behave consistently — flagged here rather
  than silently introduced, in case it should instead be split into a follow-up issue.
- The global, non-game-scoped endpoints (`GET /treasures.json`, `GET /treasures/<id>.json`,
  `POST /treasures.json`) intentionally keep reading/writing `Treasure.value` directly — there is
  no `game` in context there, so `resolve_treasure_value` always falls back to `treasure.value`,
  matching current behavior.
- Per the confirmed scope, no new value-filter query param is added to the PC/NPC treasures
  endpoints — only their existing display and ordering change.
