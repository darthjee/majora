# Backend Plan: Add GameItem and CharacterItem edit/update page

Main plan: [plan.md](plan.md)

## Shared contracts

- `PATCH /games/:game_slug/items/:id.json` — `GameItem` only, `GameEditPermission` (dm/admin only), partial `{name?, description?, hidden?}`, 200 response via `GameItemDetailFullSerializer`.
- `PATCH /games/:game_slug/pcs/:character_id/items/:id.json` / `.../npcs/:character_id/items/:id.json` — `CharacterItem` only, `CharacterItemCreatePermission` reused as-is (dm/admin/staff/owner via `character.can_be_edited_by`), 200 response via `CharacterItemDetailFullSerializer`. NPC variant additionally 404s via `_hidden_gate_response` before permission/update logic when the NPC is hidden and the requester can't edit it.
- Blank `name`/`description` on `CharacterItem` PATCH persists as `null` (fallback to `GameItem`), not `''`. `GameItem`'s `name` stays required/non-blank.
- No new URL entries — `game_item_detail` (`backend/games/urls/games.py`) and each `game_{kind}_item_detail` route (generated from `backend/games/urls/_character_routes.py`'s `item_detail` entry) simply gain `PATCH` on their existing `@api_view` decorator.
- Serializer names assume #765's rename has landed (`*DetailFullSerializer`). If not yet merged, use `*DetailAllSerializer` and update later.

## Implementation Steps

### Step 1 — `GameItemUpdateSerializer`

New file (suggest `backend/games/serializers/games/items/game_item_update.py`), `ModelSerializer` mirroring `GameUpdateSerializer` (`backend/games/serializers/games/game_update.py`):

```python
class GameItemUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = GameItem
        fields = ['name', 'description', 'hidden']
        extra_kwargs = {
            'name': {'required': False},
            'description': {'required': False},
            'hidden': {'required': False},
        }
```

No blank→null coercion here — `GameItem` has no fallback target, so a blank `name` should fail validation normally (default `CharField` `allow_blank=False`).

### Step 2 — `CharacterItemUpdateSerializer`

New file (suggest `backend/games/serializers/characters/character_item_update.py`), same shape as Step 1 but `name`/`description` additionally `allow_null=True, allow_blank=True`, plus a `validate()` override that maps `''` → `None` for `name`/`description` (not `hidden`) before save:

```python
class CharacterItemUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CharacterItem
        fields = ['name', 'description', 'hidden']
        extra_kwargs = {
            'name': {'required': False, 'allow_null': True, 'allow_blank': True},
            'description': {'required': False, 'allow_null': True, 'allow_blank': True},
            'hidden': {'required': False},
        }

    def validate(self, attrs):
        for field in ('name', 'description'):
            if attrs.get(field) == '':
                attrs[field] = None
        return attrs
```

### Step 3 — Widen the game-scoped item detail view

Find `game_item_detail` (view backing `backend/games/urls/games.py`'s `game-item-detail` route — likely `backend/games/views/games/game_item_detail.py` or `backend/games/views/game/`, confirm exact file at implementation time). Follow the `detail_or_update` pattern already used by `game_detail.py` (`backend/games/views/common.py:72-99`):
- Add `'PATCH'` to the `@api_view([...])` methods list.
- On PATCH: `GameEditPermission.check(request, game)` (reuse as-is, no new permission class — it already means "dm/admin only"), then `GameItemUpdateSerializer(item, data=request.data, partial=True)`, validate, save, respond with `GameItemDetailFullSerializer(item).data`.

### Step 4 — Widen the character-scoped item detail views (PC + NPC)

The `item_detail` view is generated/shared via `backend/games/urls/_character_routes.py` + `backend/games/views/game/_character_shared.py` for both `pcs` and `npcs`. Widen it to accept PATCH:
- Add `'PATCH'` to the relevant `@api_view([...])`.
- Permission: `CharacterItemCreatePermission.check(request, character)` (reused as-is — already dm/admin/staff/owner via `character.can_be_edited_by`).
- **NPC-only extra gate**: before the permission check, when `npc=True`, call the same hidden-visibility check used by `GET /games/:game_slug/npcs/:character_id` (`_hidden_gate_response` in `backend/games/views/game/_shared.py:32-38`) against the character — if it returns a response (404), return it immediately, short-circuiting before `CharacterItemCreatePermission` even runs. This is what makes `staff` lose access to a hidden NPC's items despite otherwise having item-edit permission.
- On success: `CharacterItemUpdateSerializer(character_item, data=request.data, partial=True)`, validate, save, respond with `CharacterItemDetailFullSerializer(character_item).data`.

### Step 5 — Tests

- `GameItem` PATCH: dm/admin succeed; other roles 403; blank `name` rejected (400); partial update (only `hidden`) leaves `name`/`description` untouched.
- `CharacterItem` PATCH (PC): dm/admin/staff/owner succeed; other players 403; blank `name`/`description` persists `null` and the response still resolves the value from `GameItem` via existing fallback; `hidden` has no fallback (independent field).
- `CharacterItem` PATCH (NPC): dm/admin/staff succeed on a visible NPC; on a **hidden** NPC, `staff` gets 404 (via the hidden-gate pre-check), dm/admin still succeed.
- Confirm/add coverage that `GET /games/:game_slug/npcs/:character_id` already 404s for unauthorized viewers of a hidden NPC (`backend/games/views/game/_detail.py` + `_shared.py`) — expected to already pass, no production change needed there.

## Files to Change

- `backend/games/serializers/games/items/game_item_update.py` — new, `GameItemUpdateSerializer`.
- `backend/games/serializers/characters/character_item_update.py` — new, `CharacterItemUpdateSerializer`.
- Game-scoped item detail view (locate exact file via `backend/games/urls/games.py`'s `game-item-detail` route) — add PATCH handling.
- `backend/games/views/game/_character_shared.py` (or wherever `item_detail` is built for pcs/npcs) — add PATCH handling + NPC hidden-gate pre-check.
- New/updated tests under `backend/games/tests/views/games/` and `backend/games/tests/views/game/{pcs,npcs}/detail/items/` for each PATCH endpoint.
- New serializer tests for `GameItemUpdateSerializer` / `CharacterItemUpdateSerializer` under `backend/games/tests/serializers/`.

## CI Checks

- `backend`: `poetry run pytest games/tests/views/game/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_views_characters`) — pcs/npcs item PATCH tests.
- `backend`: `poetry run pytest games/tests/views/ --ignore=games/tests/views/game/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_views_rest`) — game-scoped item PATCH tests.
- `backend`: `poetry run pytest --ignore=games/tests/views/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_all`) — serializer-level tests.

## Notes

- No new permission classes needed: `GameEditPermission` and `CharacterItemCreatePermission` already express exactly the rules this issue asks for.
- The NPC hidden-gate is a pre-check reusing existing internal logic (`_hidden_gate_response`) — not an actual HTTP call to the GET endpoint.
- Confirm the exact file backing `game_item_detail` at implementation time — exploration found the route but the view module's exact path wasn't pinned down with full certainty.
