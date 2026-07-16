# Plan: Add total value to character treasure

Issue: [581-add-total-value-to-character-treasure.md](../issues/581-add-total-value-to-character-treasure.md)

## Overview

Add a `treasure_value` field — the sum of `total_value` across a character's `CharacterTreasure`
rows — to the npc/pc list, detail, and full endpoints (plus the DM-only `npcs/all.json` list).
`CharacterTreasure.total_value` is already a stored, maintained field (added by #564), so this is
purely an aggregation-and-exposure change: no new pricing logic. All work is backend-only
(models/views/serializers), so this plan is not split across agents.

## Context

- `CharacterTreasure.total_value` (`backend/games/models/character/character_treasure.py:17`)
  is kept in sync with `quantity * value` on acquire/sell
  (`backend/games/views/game/_treasure_exchange.py:108,151`).
- `Character` has no existing aggregate for this; `character.character_treasures` is the reverse
  FK relation (`related_name='character_treasures'` on `CharacterTreasure.character`).
- The six endpoints named in the issue, plus `npcs/all.json`, funnel through a small number of
  shared functions:
  - Single-character fetch (detail + full): `_find_character` in
    `backend/games/views/game/_shared.py:9-13`, called by `_get_character_or_404` (used by both
    `_detail.py` and `_full.py`).
  - Lists: `game.characters.filter(...)` querysets built directly in
    `backend/games/views/game/npcs/game_npcs.py:32`,
    `backend/games/views/game/pcs/game_pcs.py:15`, and
    `backend/games/views/game/npcs/game_npcs_all.py:24`.
- Serializers: `CharacterListSerializer` (`character_list.py`) is used by both list endpoints and
  extended by `CharacterFullListSerializer` (`character_full_list.py`, used by `npcs/all.json`).
  `CharacterDetailSerializer` (`character_detail.py`) is used by both detail endpoints and
  extended by `CharacterFullSerializer` (`character_full.py`, used by both full endpoints). Adding
  the field to the two base serializers covers all four subclasses/endpoints for free.
- No `Sum`-across-a-relation aggregate pattern exists yet in this codebase — the closest analog
  (`resolve_treasure_value` / game-treasure-value annotations in
  `backend/games/serializers/games/treasures/game_treasure_fields.py`) resolves a single
  per-row override value, not a sum across a one-to-many relation.

## Implementation Steps

### Step 1 — Shared queryset annotation helper

Add a small helper (e.g. `_with_treasure_value(queryset)` in `_shared.py`, or a new
`_treasure_value.py` alongside it) that annotates a `Character` queryset with:

```python
from django.db.models import Sum
from django.db.models.functions import Coalesce

queryset.annotate(treasure_value=Coalesce(Sum('character_treasures__total_value'), 0))
```

`Coalesce(..., 0)` avoids `NULL` for characters with zero treasure rows. Double-check there is no
other `annotate()` already applied to any of these querysets that also aggregates over a
different one-to-many relation — stacking two such annotations on the same queryset without care
is a classic Django pitfall (join fan-out silently inflating sums). Based on the exploration
above, none of the four call sites below currently annotate anything else, but verify at
implementation time and add a regression test (a character with 2+ treasure rows) if there's any
doubt.

### Step 2 — Apply the annotation at every read call site

- `_find_character` (`backend/games/views/game/_shared.py:9-13`) — annotate here so both
  `npcs/:id.json`/`pcs/:id.json` (via `_detail.py`) and `npcs/:id/full.json`/`pcs/:id/full.json`
  (via `_full.py`) pick it up automatically. The extra annotated attribute is harmless for the
  other endpoints that share this helper (access, permissions, photo upload, update) since their
  serializers don't reference it.
- `game_npcs.py:32` (`npcs.json`) — annotate `npcs` before `_filter_characters`/pagination.
- `game_pcs.py:15` (`pcs.json`) — annotate `pcs` similarly.
- `game_npcs_all.py:24` (`npcs/all.json`) — annotate `npcs` similarly.

Annotating before `_filter_characters`/pagination keeps this a single query per list request (no
N+1 across paginated rows).

### Step 3 — Expose the field in serializers

- `CharacterListSerializer` (`character_list.py`): add
  `treasure_value = serializers.IntegerField(read_only=True)` and include `'treasure_value'` in
  `Meta.fields`. `CharacterFullListSerializer` inherits it automatically.
- `CharacterDetailSerializer` (`character_detail.py`): same addition, placed near the existing
  `money` field for readability. `CharacterFullSerializer` inherits it automatically.

### Step 4 — Tests

- `backend/games/tests/serializers/characters/character_list_test.py`,
  `character_detail_test.py`, `character_full_test.py`, `character_full_list_test.py`: assert
  `treasure_value` is present and correctly summed for a character with multiple
  `CharacterTreasure` rows, and is `0` for a character with none.
- `backend/games/tests/views/game/npcs/*` and `.../pcs/*` (list, detail, full test files): assert
  the field appears in the JSON response for `npcs.json`, `pcs.json`, `npcs/:id.json`,
  `pcs/:id.json`, `npcs/:id/full.json`, `pcs/:id/full.json`, and `npcs/all.json`.
- Add at least one test with 2+ `CharacterTreasure` rows for the same character to guard against
  the join-fan-out pitfall mentioned in Step 1.

## Files to Change

- `backend/games/views/game/_shared.py` — add the annotation helper; apply it in `_find_character`.
- `backend/games/views/game/npcs/game_npcs.py` — annotate the `npcs` queryset.
- `backend/games/views/game/pcs/game_pcs.py` — annotate the `pcs` queryset.
- `backend/games/views/game/npcs/game_npcs_all.py` — annotate the `npcs` queryset.
- `backend/games/serializers/characters/character_list.py` — add `treasure_value` field.
- `backend/games/serializers/characters/character_detail.py` — add `treasure_value` field.
- `backend/games/tests/serializers/characters/character_list_test.py` — new assertions.
- `backend/games/tests/serializers/characters/character_detail_test.py` — new assertions.
- `backend/games/tests/serializers/characters/character_full_test.py` — new assertions.
- `backend/games/tests/serializers/characters/character_full_list_test.py` — new assertions.
- Relevant view test files under `backend/games/tests/views/game/npcs/` and `.../pcs/` — new
  assertions for the field in list/detail/full responses.

## CI Checks

- `backend`: `poetry run pytest games/tests/views/game/` (CI job: `pytest_views_game`) — covers
  the view-level test changes.
- `backend`: `poetry run pytest --ignore=games/tests/views/` (CI job: `pytest_all`) — covers the
  serializer-level test changes.

## Notes

- No migration is needed — `total_value` already exists on `CharacterTreasure` (#564); this issue
  only adds an aggregation and its exposure.
- `data-access`/`security` review (outside this plan's scope, applied later during
  implementation/PR review) should confirm `treasure_value` doesn't leak anything beyond what
  `money` and the per-treasure `value` (via the existing treasures-index endpoints) already
  expose publicly — it's a sum of already-public per-row values, so no new disclosure is
  expected, but worth a final check given `npcs/:id.json` and `npcs.json` are `AllowAny`.
