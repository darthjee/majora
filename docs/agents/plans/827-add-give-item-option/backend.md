# Backend Plan: Add give item option

Main plan: [plan.md](plan.md)

## Shared contracts

Produces the four summary endpoints and the relaxed acquire endpoint described in `plan.md`'s
"Shared contracts" — exact paths, response shape, and error semantics are specified there; this
file only covers how to build them.

## Implementation Steps

### Step 1 — Drop the `CharacterItem` uniqueness constraint

Remove `unique_together = [('character', 'game_item')]` from `CharacterItem.Meta`
(`backend/games/models/character/character_item.py:35`) and generate the migration
(`poetry run python manage.py makemigrations games`).

### Step 2 — Relax `character_item_acquire`

In `backend/games/views/game/_item_exchange.py`, remove the `get_or_create`/`not created` 400
dedup check (lines 84-88) from `character_item_acquire` — always create via
`CharacterItem.objects.create(character=character, game_item=game_item, hidden=hidden)` and
return the `201`. Leave `character_item_remove` and the `allow_hidden` gating untouched. Check
existing tests that assert the "already owned" 400 (likely under
`backend/games/tests/views/game/pcs/detail/items/` and `.../npcs/detail/items/`, e.g. the
`*_acquire_test.py` files) — update or remove the now-invalid assertions, and add a test
confirming two consecutive acquire calls for the same `(character, game_item)` both succeed and
produce two distinct `CharacterItem` rows.

### Step 3 — Add the `@skip_cache` decorator

In `backend/games/decorators.py`, add a `skip_cache` decorator mirroring `restricted`'s
implementation (unconditionally sets `X-Skip-Cache: true`) but documented as the cache-only
counterpart, distinct from `restricted`'s permission connotation — usable stacked with `@regular`.
Reuse `restricted`'s wrapper body (or factor a shared helper) rather than duplicating logic
error-prone-ly; keep both decorators' docstrings accurate about when to use which.

### Step 4 — Build the summary views

Add two new view functions (naming should follow the existing per-endpoint file convention under
`backend/games/views/game/pcs/detail/items/` and `backend/games/views/game/npcs/detail/items/`,
e.g. `game_pc_item_summary.py` / `game_npc_item_summary.py`, plus their `_all` counterparts) that:

1. Resolve `game` and `item_id` → `GameItem` (404 if missing/not in this game).
2. Resolve `character_id` via `_get_character_or_404` (`backend/games/views/game/_shared.py`),
   matching the existing pc/npc split.
3. Regular variant: gate on `_hidden_gate_response` (same as `character_detail`'s `check_hidden`
   path) — 404s hidden characters instead of omitting them.
4. Compute `quantity = character.character_items.filter(game_item=game_item, hidden=False).count()`
   for the regular variant (drop the `hidden=False` filter for `/all.json`, matching how other
   `_all` variants expose hidden rows to dm/admin).
5. Return `Response({'quantity': quantity})`.
6. Decorate: regular views with `@regular` + the new `@skip_cache`; `/all.json` views with
   `@restricted`. For the pc `/all.json` variant, the permission check must allow dm/admin **and**
   the PC's own owner — reuse the same `EndpointPermission(request.user, game=game,
   pc=character).check(...)` pattern already used by `_check_item_create`
   (`_item_exchange.py:15-19`) against the `game_pc_item`/`game_npc_item` resource names
   (`_character_item_resource` in `_shared.py:37-39`); confirm against
   `backend/games/permissions/config/pages/character_pc.yml` /
   `character_npc.yml` whether an existing action tier already grants dm/admin/owner read access
   to this resource or whether a new permission entry is needed, and prefer reusing an existing
   tier over inventing a new one.

### Step 5 — Wire up URLs

These four routes are item-scoped-then-character (`items/:item_id/{pcs,npcs}/:character_id/...`),
the reverse of `_character_routes.py`'s character-scoped-then-subresource builder, so they don't
fit that helper. Add them as direct `path()` entries in `backend/games/urls/games.py`, alongside
the existing `items/<int:item_id>/full.json` / `photo_upload.json` entries
(`backend/games/urls/games.py:100-114`), e.g.:

```python
path(
    'games/<slug:game_slug>/items/<int:item_id>/pcs/<int:character_id>/summary.json',
    views.game_item_pc_summary,
    name='game-item-pc-summary',
),
```

(and the analogous `npcs` / `/summary/all.json` variants). Export the new view functions from
`backend/games/views/game/__init__.py` following the existing export convention.

## Files to Change

- `backend/games/models/character/character_item.py` — drop `unique_together`.
- `backend/games/migrations/` — new migration for the above.
- `backend/games/views/game/_item_exchange.py` — remove the "already owned" 400 check.
- `backend/games/decorators.py` — add `skip_cache`.
- `backend/games/views/game/pcs/detail/items/` and `.../npcs/detail/items/` — new summary +
  summary-all view modules.
- `backend/games/urls/games.py` — four new `path()` entries.
- `backend/games/views/game/__init__.py` — export the new views.
- `backend/games/permissions/config/pages/character_pc.yml` /
  `backend/games/permissions/config/pages/character_npc.yml` — only if no existing tier already
  covers the new summary/all.json read access.
- Tests: new tests for the four summary endpoints (200 quantity count, 404 on hidden character for
  the regular variant, permission checks for `/all.json`), updated acquire tests (Step 2).

## CI Checks

- `backend`: `poetry run pytest games/tests/views/game/ --cov` (CI job: `pytest_views_characters`)
  — covers the new character-scoped summary views and the modified acquire view.
- `backend`: `poetry run ruff check .` and `bin/reports.sh ci` (CI job: `checks`) — lint and
  complexity.

## Notes

- Removing the acquire endpoint's dedup check is a behavior change for whatever existing
  self-service "acquire item" UI already calls it — players will be able to acquire duplicate
  items too, not just DMs via the new bulk modal. This is intentional per the issue, but worth
  flagging in the PR description.
- Whether the `/all.json` pc-owner permission tier already exists or needs a new permissions
  config entry is an open question this plan defers to implementation-time investigation (Step
  4.6) rather than guessing at YAML contents.
