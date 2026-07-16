# Plan: Add game treasure value

Issue: [568-add-game-treasure-value.md](../../issues/568-add-game-treasure-value.md)

## Overview

Add a required `value` field to `GameTreasure` (`backend/games/models/game/game_treasure.py`), the through-model linking a `Game` to a `Treasure`. Make `GameTreasure` creation explicit: `POST /games/<slug>/treasures.json` will now also create the link row (with `value` copied from the new `Treasure`), and the previously-lazy `get_or_create` inside the `PATCH /games/<slug>/treasures/<treasure_id>.json` flow is replaced with a strict lookup. A migration backfills `value` on existing rows and creates missing rows for exclusive treasures, which never had one.

This is entirely a `backend/` change — no frontend, proxy, or infra work, and no new/changed API response fields (`value` is not exposed on `GameTreasure` in any serializer).

## Context

- `Treasure.value` (`backend/games/models/treasure/treasure.py`) is a required `IntegerField`. `GameTreasure` has no `value` of its own today.
- `GameTreasure` rows are created in exactly two places today:
  1. `_create_game_treasure` in `backend/games/views/games/game_treasures.py` — **does not** create one; it only creates a `Treasure` exclusive to the game (`Treasure.game` set).
  2. `_update_linked_treasure` in `backend/games/views/games/game_treasure_detail.py` — `GameTreasure.objects.get_or_create(game=game, treasure=treasure)`. In practice this is a dead-code "create" branch: `_get_game_treasure_or_404` resolves `treasure_id` via `Q(game=game) | Q(linked_game=game)`, and `linked_game` only matches treasures that already have a `GameTreasure` row (it's the M2M's `related_query_name`). So a request can only ever reach `_update_linked_treasure` for a treasure that is already linked — the `get_or_create` never actually creates a row through this endpoint. Replacing it with a strict lookup changes no observable behavior on this endpoint.
- Because of the above, **no exclusive treasure currently has a `GameTreasure` row at all** — `_update_game_treasure` routes exclusive treasures (`treasure.game_id == game.id`) to `_update_exclusive_treasure`, which only touches the `Treasure` row, never `GameTreasure`.
- The only other place a `GameTreasure` row is created is the Django admin: `GameTreasureInline` on `GameAdmin` (`backend/games/admin.py`), currently `fields = ('treasure', 'max_units', 'acquired_units')` — no `value`.
- `value` is a one-time snapshot — never kept in sync with `Treasure.value` afterward (confirmed with the user; this is intentional so a game-level override is possible in the future).

## Implementation Steps

### Step 1 — Add `GameTreasure.value` via a two-step migration

In `backend/games/models/game/game_treasure.py`, add:
```python
value = models.IntegerField()
```
placed after `treasure`, before `max_units`.

Generate migrations in two steps so the column can be backfilled before being made `NOT NULL`:

1. **Migration A** (`AddField` + data backfill in one file, following the pattern in `backend/games/migrations/0046_userprofile_email_hash.py`):
   - `AddField(model_name='gametreasure', name='value', field=models.IntegerField(null=True, blank=True))`
   - `RunPython` forwards function that, using `apps.get_model`:
     - Updates `value` on every existing `GameTreasure` row to the `value` of its linked `Treasure` (`update(value=F('treasure__value'))` works in one query, or loop + `update_fields=['value']` to match the existing repo pattern — either is fine, prefer the `F()` expression for a single-query backfill since there's no other per-row logic needed).
     - Creates a `GameTreasure` row (`value` = `treasure.value`) for every `Treasure` where `game_id` is not null and that has no matching `GameTreasure` row yet (e.g. `Treasure.objects.filter(game__isnull=False).exclude(id__in=GameTreasure.objects.values_list('treasure_id', flat=True))`, filtered further by matching `game_id` since a `GameTreasure` needs both `game` and `treasure`; exclusive treasures only ever need linking to their own `game`).
     - Reverse function is a no-op (the field removal is handled by Migration A's `AddField` reversal automatically — no `RunPython` reverse needed beyond `migrations.RunPython.noop`).
2. **Migration B**: `AlterField(model_name='gametreasure', name='value', field=models.IntegerField())` — drops `null=True, blank=True`, making the column `NOT NULL`.

Run `poetry run python manage.py makemigrations` after the model change to get correct dependency numbering; adjust the generated migration into the two-step shape above if `makemigrations` produces a single `AddField` — the data backfill must run in between.

### Step 2 — Create the `GameTreasure` row on exclusive-treasure creation

In `backend/games/views/games/game_treasures.py`, `_create_game_treasure`, after:
```python
treasure = serializer.save(game=game, game_type=game.game_type)
```
add:
```python
GameTreasure.objects.create(game=game, treasure=treasure, value=treasure.value)
```
Import `GameTreasure` from `...models`. The response (`TreasureDetailSerializer(treasure)`) is unchanged — `value` isn't exposed on `GameTreasure`.

### Step 3 — Replace the lazy `get_or_create` with a strict lookup

In `backend/games/views/games/game_treasure_detail.py`, `_update_linked_treasure`, replace:
```python
game_treasure, _created = GameTreasure.objects.get_or_create(game=game, treasure=treasure)
```
with:
```python
game_treasure = get_object_or_404(GameTreasure, game=game, treasure=treasure)
```
(`get_object_or_404` is already imported at the top of this file.) As established in Context, this is a no-op behavior change on this endpoint in practice — it's already unreachable for a genuinely-unlinked treasure — but it removes the implicit-creation responsibility from this endpoint going forward.

### Step 4 — Expose `value` in the Django admin inline

In `backend/games/admin.py`, `GameTreasureInline.fields`, add `'value'`:
```python
fields = ('treasure', 'value', 'max_units', 'acquired_units')
```
Needed because `value` is now required — without this, staff couldn't create a new link row via the admin inline at all (the form would omit a required field). This is the only remaining way to link a *global* treasure to a game now that the PATCH endpoint no longer creates rows implicitly.

### Step 5 — Update existing tests for the now-required `value`

`value` becomes required on every `GameTreasure` row, which affects test setup in two ways:

1. **Direct `GameTreasure.objects.create(...)` / `GameTreasure(...)` calls** — `backend/games/tests/models/game/game_treasure_test.py` and `backend/games/tests/serializers/games/treasures/game_treasure_update_test.py` construct `GameTreasure` directly (17 call sites total). Add a `value=` kwarg to each.
2. **`game.treasures.add(treasure)` / `.set([...])` calls** — Django's M2M `.add()`/`.set()` on a through-model with an extra required field needs `through_defaults` (e.g. `game.treasures.add(treasure, through_defaults={'value': treasure.value})`), otherwise it will fail a `NOT NULL` constraint. Affected files (found via `grep -rl '\.treasures\.add(\|\.treasures\.set(' backend/games/tests/`):
   - `games/tests/models/game/game_test.py`
   - `games/tests/models/treasure/treasure_test.py`
   - `games/tests/serializers/treasures/treasure_detail_test.py`
   - `games/tests/serializers/treasures/treasure_list_test.py`
   - `games/tests/views/game/npcs/detail/treasures/game_npc_treasure_sell_test.py`
   - `games/tests/views/game/npcs/detail/treasures/game_npc_treasure_acquire_test.py`
   - `games/tests/views/games/game_treasures_all_test.py`
   - `games/tests/views/games/game_treasure_detail_test.py`
   - `games/tests/views/games/game_treasures_test.py`

   Consider adding a `GameTreasureFactory` to `games/tests/factories.py` (following the `TreasureFactory` pattern) to reduce repetition across these call sites, but this is optional — direct fixes at each call site are also acceptable.

### Step 6 — Add new tests for the changed behavior

- **Model** (`game_treasure_test.py`): `value` is required — omitting it raises `IntegrityError` on save (mirrors the existing `unique_together` test style).
- **Migration backfill**: if this repo has a pattern for testing data migrations, follow it; otherwise, cover the equivalent logic via the model/view tests below (the backfill's `F()`/queryset logic is simple enough that dedicated migration tests may not be necessary — use judgment during implementation).
- **`game_treasures_test.py` (`TestGameTreasuresCreate`)**: after a successful POST, assert a `GameTreasure` row now exists for `(game, treasure)` with `value` equal to the posted `value`.
- **`game_treasure_detail_test.py`**: add a case where a global `Treasure` is *not* linked to the game (no `GameTreasure` row, not exclusive) and PATCH-ing it via `/games/<slug>/treasures/<treasure_id>.json` returns 404 — this documents the strict-lookup behavior directly (previously this case likely also 404'd via `_get_game_treasure_or_404`, so confirm rather than assume).

## Files to Change

- `backend/games/models/game/game_treasure.py` — add `value` field.
- `backend/games/migrations/<next>_gametreasure_value.py` — add nullable `value` + backfill (new).
- `backend/games/migrations/<next+1>_alter_gametreasure_value_not_null.py` — make `value` `NOT NULL` (new).
- `backend/games/views/games/game_treasures.py` — create `GameTreasure` on exclusive-treasure creation.
- `backend/games/views/games/game_treasure_detail.py` — strict lookup instead of `get_or_create`.
- `backend/games/admin.py` — add `value` to `GameTreasureInline.fields`.
- `backend/games/tests/models/game/game_treasure_test.py` — add `value=` to constructors; add required-field test.
- `backend/games/tests/serializers/games/treasures/game_treasure_update_test.py` — add `value=`.
- `backend/games/tests/models/game/game_test.py`, `backend/games/tests/models/treasure/treasure_test.py`, `backend/games/tests/serializers/treasures/treasure_detail_test.py`, `backend/games/tests/serializers/treasures/treasure_list_test.py`, `backend/games/tests/views/game/npcs/detail/treasures/game_npc_treasure_sell_test.py`, `backend/games/tests/views/game/npcs/detail/treasures/game_npc_treasure_acquire_test.py`, `backend/games/tests/views/games/game_treasures_all_test.py`, `backend/games/tests/views/games/game_treasure_detail_test.py`, `backend/games/tests/views/games/game_treasures_test.py` — add `through_defaults={'value': ...}` to `.treasures.add()`/`.set()` calls; extend `game_treasures_test.py` and `game_treasure_detail_test.py` per Step 6.
- `backend/games/tests/factories.py` — optionally add `GameTreasureFactory`.

## CI Checks

- `backend`: `poetry run pytest games/tests/views/ --ignore=games/tests/views/game/ --cov` (CI job: `pytest_views_rest`) — covers `games/tests/views/games/*`.
- `backend`: `poetry run pytest --ignore=games/tests/views/ --cov` (CI job: `pytest_all`) — covers the model, serializer, and admin-adjacent tests.
- `backend`: `poetry run ruff check .` (CI job: `checks`)

## Notes

- No serializer or API response exposes `GameTreasure.value` in this issue — confirmed with the user this is deliberately out of scope; a future issue will use it.
- The strict-lookup change in Step 3 is a no-op in practice (see Context) but is included because the issue explicitly asks to stop treating creation as this endpoint's responsibility.
- `GameTreasure` is intentionally excluded from `django-simple-history` tracking (see `docs/agents/architecture.md`'s "versioning" section) — no history-table migration is needed for the new field.
- Consider whether `Migration A`'s backfill should use a single `F()`-expression `update()` for the "existing rows" pass (fast, one query) versus needing a Python loop only for the "create missing rows" pass (since that needs one `GameTreasure` per `Treasure`, not a bulk update) — `bulk_create` is an option for the second pass if the number of exclusive treasures is large enough to matter, otherwise a simple loop with `get_or_create`-free `GameTreasure.objects.create` (guarded by the `exclude(id__in=...)` filter) is fine.
