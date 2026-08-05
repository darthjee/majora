# Backend Plan: Allow game links edit

Main plan: [plan.md](plan.md)

## Shared contracts

This agent **produces** the `PATCH /games/:game_slug.json` regular/restricted split and the
`can_edit_regular` permission flag described in [plan.md](plan.md)'s "Shared contracts" section —
the frontend agent consumes both. The `GameAccessSerializer`/`access.json` side already exists
and needs no backend change.

## Implementation Steps

### Step 1 — `GameLinkWriteSerializer` + `GameLinksSync`

Add `backend/games/serializers/games/game_link_write.py`, parallel to
`games/serializers/characters/character_link_write.py`:

- `GameLinkWriteSerializer(serializers.ModelSerializer)` — `model = GameLink`,
  `fields = ['id', 'text', 'url', 'link_type', 'delete']`, `id` overridden writable
  (`IntegerField(required=False)`), `delete` a transient `BooleanField(required=False,
  default=False)` (not a model field). Same `validate()` rules as `CharacterLinkWriteSerializer`:
  `id` required when `delete` is true; `url` required for a new (id-less), non-deleted entry.
- `GameLinksSync` — same shape as `CharacterLinksSync`: `__init__(self, game, entries)`, `apply()`
  (transaction-wrapped create/update/delete dispatch per entry via `_apply_entry`/`_create`/
  `_update`/`_delete`/`_find`, scoped to `game.links`).
- Reuse `validate_links_count`/`MAX_LINKS` from `character_link_write.py` directly (it's already
  generic — takes a list, doesn't reference `Character`) rather than duplicating it.

### Step 2 — `GameUpdateSerializer` gains `links` (restricted/full tier)

Edit `games/serializers/games/game_update.py`:

- Add `links = GameLinkWriteSerializer(many=True, required=False)`.
- `Meta.fields = ['name', 'description', 'links']`.
- Add `validate_links(self, value)` → `return validate_links_count(value)`.
- Override `update(self, instance, validated_data)`: pop `links`, call `super().update(...)` for
  the scalar fields, then `GameLinksSync(instance, links).apply()`, return `instance` — same shape
  as `CharacterUpdateSerializer.update()`.

### Step 3 — `GameRegularUpdateSerializer` (new, regular tier)

Add `backend/games/serializers/games/game_regular_update.py`:

- `Meta.fields = ['description', 'links']` (no `name`).
- Same `links` field, `validate_links`, and `update()` override as Step 2 (duplicate rather than
  subclass, matching the codebase's existing style of parallel, separate serializers — see
  `CharacterRegularUpdateSerializer` vs `CharacterUpdateSerializer` for precedent).

### Step 4 — Permission config: add the `regular` tier for `game`

Edit `games/permissions/config/game/endpoints.yml`: add

```yaml
regular:
  regular_edit: [staff, player]
restricted:
  edit: []
```

(the `restricted.edit: []` block already exists and is unchanged — dm/admin pass via the
always-on shortcut; no `owner` role added, since `owner` is PC-scoped and doesn't apply to games).

Edit `games/permissions/config/game/ui.yml`: add a `regular_edit: [staff, player]` key alongside
the existing `edit: []`, so `can_edit_regular` can be resolved for the UI-permissions endpoint too.

Edit `games/permissions/config/pages/game.yml`: add `regular_edit: can_edit_regular` alongside the
existing `edit: can_edit`.

### Step 5 — View-layer dispatch for `game_detail`'s PATCH

Add `backend/games/views/games/_regular.py` and `_full.py` (or a `_shared.py` dispatcher — mirror
whichever split `games/views/game/_regular.py`/`_full.py`/`_shared.py` use for `game_pc`/
`game_npc`, adapted since `game` has no PC/NPC resource-name branching):

- `_regular.py`: checks
  `EndpointPermission(request.user, game=game).check(request, 'game', 'regular', 'regular_edit')`;
  on pass, updates via `GameRegularUpdateSerializer`.
- `_full.py`: checks
  `EndpointPermission(request.user, game=game).check(request, 'game', 'restricted', 'edit')`
  (unchanged from today's `check_game_edit`); on pass, updates via `GameUpdateSerializer`.
- Update `games/views/games/game_detail.py`'s PATCH branch to try the restricted check first, fall
  back to the regular check, and 403 if neither passes — mirroring the PC/NPC dispatch order.

Keep `check_game_edit` (`games/views/common.py`) as-is — the ~20 other DM-only endpoints that use
it (items, documents, treasures, sessions, photo upload, etc.) are unaffected by this split; only
`game_detail`'s PATCH gets the new regular path.

### Step 6 — Migration

`Game.links`/`GameLink` already exist (no model change needed) — this step introduces no new
model fields, so no Django migration is required.

## Files to Change

- `games/serializers/games/game_link_write.py` — new: `GameLinkWriteSerializer` + `GameLinksSync`.
- `games/serializers/games/game_update.py` — add `links` field + `update()` override.
- `games/serializers/games/game_regular_update.py` — new: regular-tier serializer.
- `games/permissions/config/game/endpoints.yml` — add `regular.regular_edit: [staff, player]`.
- `games/permissions/config/game/ui.yml` — add `regular_edit: [staff, player]`.
- `games/permissions/config/pages/game.yml` — add `regular_edit: can_edit_regular`.
- `games/views/games/game_detail.py` (+ new `_regular.py`/`_full.py` or `_shared.py`) — dispatch
  PATCH between the two tiers.

## CI Checks

- `backend`: `poetry run pytest games/tests/views/game/ --cov` (CI job: `pytest_views_characters`
  — covers the new `game_detail` view tests; despite the job name, this path is where `game`-level
  view tests for the split live too, alongside `game_pc`/`game_npc`).
- `backend`: `poetry run pytest --ignore=games/tests/views/ --cov` (CI job: `pytest_all` — covers
  the new serializer tests under `games/tests/serializers/games/`).
- `backend`: `poetry run ruff check .` (CI job: `checks` — lint).

## Notes

- Confirm the exact view-layer file names/dispatch shape against
  `games/views/game/_regular.py`/`_full.py`/`_shared.py` before writing — those are the literal
  precedent this step mirrors, referenced by name in the issue but not re-verified path-by-path
  during planning.
- `GameLinksSync`/`GameLinkWriteSerializer` intentionally duplicate `CharacterLinksSync`/
  `CharacterLinkWriteSerializer` rather than sharing a base class — this was an explicit decision
  during issue refinement (isolate the change from already-shipped character code), not an
  oversight.
