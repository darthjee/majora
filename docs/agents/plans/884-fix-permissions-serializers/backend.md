# Backend Plan: Fix permissions serializers

Main plan: [plan.md](plan.md)

## Shared contracts

- Must add `can_edit_money`, `can_exchange_treasure`, `can_set_profile_photo`, `can_delete_photo` to `CharacterPermissionsSerializer`'s JSON output, alongside its existing `can_edit`, `can_create_item`, `can_upload_item_photo`.
- Must remove those same 4 fields (plus the pre-existing `can_edit`) from `CharacterDetailSerializer`'s (and therefore `CharacterFullSerializer`'s) JSON output.
- `permissions.json`'s existing cache-header contract (`X-Skip-Cache` for real identity, `X-Force-Public-Cache` for `?role=...`) is unchanged — no route or view-selection changes needed there, only the serializer's field set grows.

## Implementation Steps

### Step 1 — Add `is_allowed_for_roles` to the 4 permission classes

In `backend/games/permissions.py`, none of `CharacterMoneyEditPermission`, `CharacterTreasureExchangePermission`, `CharacterPhotoUploadPermission`, `CharacterPhotoDeletePermission` currently has a role-simulated variant (unlike `CharacterItemCreatePermission`/`CharacterItemPlayerCreatePermission`/`CharacterItemPhotoUploadPermission`, which already do). Add one `is_allowed_for_roles` classmethod to each, mirroring that same convention and each permission's own existing `is_allowed` logic exactly (do not copy a sibling's shape verbatim — the leniency rules differ):

- `CharacterMoneyEditPermission.is_allowed_for_roles(is_superuser, is_dm, is_owner, is_staff, is_player, is_pc)`: `is_staff` → `True`; else `is_pc and is_player` → `True` (player-leniency is PC-only, matching `is_allowed`'s `character.is_pc and character.game.has_player(user)`); else `is_superuser or is_dm` → `True`; else `is_owner if is_pc else False`.
- `CharacterTreasureExchangePermission.is_allowed_for_roles(is_superuser, is_dm, is_owner, is_staff, is_pc)`: `is_staff or is_superuser or is_dm` → `True`; else `is_owner if is_pc else False`. No player-leniency (matches `is_allowed`, which has none).
- `CharacterPhotoUploadPermission.is_allowed_for_roles(is_superuser, is_dm, is_owner, is_staff, is_player, is_pc)`: `is_staff or is_player or is_superuser or is_dm` → `True`; else `is_owner if is_pc else False`. Player-leniency applies regardless of `is_pc` here (matches `is_allowed`'s `character.game.has_player(user)` with no PC gate) — this is a different shape from the money-edit variant above, confirm against the current `is_allowed` body before writing it.
- `CharacterPhotoDeletePermission.is_allowed_for_roles(is_superuser, is_dm, is_staff)`: `is_staff or is_superuser or is_dm`. No `is_owner`/`is_player` parameter — this permission has no PC/player leniency at all (mirrors `character.game.can_be_edited_by(user)` → `Game.can_be_edited_by_roles(is_superuser, is_dm)`).

Give each a short docstring explaining it exists so `CharacterPermissionsSerializer` can reuse the same rule for both the real-identity and role-simulated paths (same rationale already documented on `CharacterItemCreatePermission.is_allowed_for_roles`).

### Step 2 — Extend `CharacterPermissionsSerializer`

In `backend/games/serializers/characters/character_permissions.py`, add 4 private methods (`_get_can_edit_money`, `_get_can_exchange_treasure`, `_get_can_set_profile_photo`, `_get_can_delete_photo`) following the exact dual-path pattern already used by `_get_can_create_item`: return `False` if `character is None`; if `self._roles()` is not `None`, call the corresponding `is_allowed_for_roles(...)` with the relevant booleans (and `character.is_pc` where applicable); otherwise call `is_allowed(self._user(), character)`. Update `to_representation` to add all 4 new keys to `data`. Import the 4 permission classes from `games.permissions` alongside the 2 already imported.

### Step 3 — Strip permission fields from `CharacterDetailSerializer`

In `backend/games/serializers/characters/character_detail.py`:
- Remove all 5 `SerializerMethodField` declarations (`can_edit`, `can_edit_money`, `can_exchange_treasure`, `can_set_profile_photo`, `can_delete_photo`) and their 5 `get_*` methods.
- Remove all 5 names from `Meta.fields`.
- Remove the now-unused imports (`CharacterMoneyEditPermission`, `CharacterPhotoDeletePermission`, `CharacterPhotoUploadPermission`, `CharacterTreasureExchangePermission`, and whatever supplied `can_edit`).
- Leave every other field untouched.

`CharacterFullSerializer` (`backend/games/serializers/characters/character_full.py`) needs no direct edit — it only extends `Meta.fields` additively via `CharacterDetailSerializer.Meta.fields + [...]` and doesn't reference any `can_*` field itself, so it automatically follows the parent's shrunk field list.

### Step 4 — Remove the now-unneeded `X-Skip-Cache` forcing

Remove `response['X-Skip-Cache'] = 'true'` (and any comment whose sole rationale is the now-removed embedded permission fields / issue #730) from these 7 view call sites — verify each has no *independent* reason for the header (e.g. hidden-character 404 gating lives in a separate helper and is untouched) before removing:
- `backend/games/views/game/_detail.py`
- `backend/games/views/game/_full.py`
- `backend/games/views/game/_regular.py`
- `backend/games/views/game/_money.py`
- `backend/games/views/game/npcs/_npc_player_update.py`
- `backend/games/views/game/npcs/game_npcs.py`
- `backend/games/views/game/npcs/game_npcs_full.py`

After removal these authenticated-only endpoints fall through to `CacheControlMiddleware`'s default private/public tiers (`backend/games/settings.py`'s `cache_control_authenticated_max_age`/`cache_control_anonymous_max_age`), matching Game/Treasure detail's existing (already cacheable) behavior.

### Step 5 — Update tests

- `backend/games/tests/serializers/characters/character_detail_test.py`: remove all tests for the 5 removed fields; prune now-unused imports if nothing else in the file needs them.
- `backend/games/tests/serializers/characters/character_full_test.py`: remove `'can_edit'`/`'can_edit_money'` from `test_inherits_detail_fields`'s `expected_fields`.
- `backend/games/tests/views/game/pcs/detail/game_pc_permissions_test.py` and `.../npcs/detail/game_npc_permissions_test.py`: extend every exact-dict `data == {...}` assertion with the 4 new keys/expected values for each existing scenario (dm/superuser/anonymous/role-simulated/owner/staff/player), and add dedicated test methods for each new field's role-simulated variants (mirroring the existing `can_create_item`/`can_upload_item_photo` coverage).
- Remove the `X-Skip-Cache` header assertions tied to the 7 edited views, e.g. `game_pc_detail_test.py`'s `test_response_includes_x_skip_cache_header`/`test_patch_response_includes_x_skip_cache_header`, `game_pc_full_test.py`, `game_pc_money_test.py`, `game_npcs_test.py`, `game_npcs_full_test.py`, and their NPC-side counterparts — grep `X-Skip-Cache` in each of the 7 edited views' own test file rather than trust this list as exhaustive, and leave assertions in unrelated test files (items/photos/treasures/access) untouched.
- Remove/replace the `data['can_edit_money'] is True` assertions asserted directly off the money-update response body in `game_pc_money_test.py`/`game_npc_money_test.py` — that field is no longer in this response.

## Files to Change

- `backend/games/permissions.py` — add `is_allowed_for_roles` to 4 permission classes
- `backend/games/serializers/characters/character_permissions.py` — add 4 fields
- `backend/games/serializers/characters/character_detail.py` — remove 5 fields
- `backend/games/views/game/_detail.py` — remove `X-Skip-Cache`
- `backend/games/views/game/_full.py` — remove `X-Skip-Cache`
- `backend/games/views/game/_regular.py` — remove `X-Skip-Cache`
- `backend/games/views/game/_money.py` — remove `X-Skip-Cache`
- `backend/games/views/game/npcs/_npc_player_update.py` — remove `X-Skip-Cache`
- `backend/games/views/game/npcs/game_npcs.py` — remove `X-Skip-Cache`
- `backend/games/views/game/npcs/game_npcs_full.py` — remove `X-Skip-Cache`
- `backend/games/tests/serializers/characters/character_detail_test.py`
- `backend/games/tests/serializers/characters/character_full_test.py`
- `backend/games/tests/views/game/pcs/detail/game_pc_permissions_test.py`
- `backend/games/tests/views/game/npcs/detail/game_npc_permissions_test.py`
- `backend/games/tests/views/game/pcs/detail/game_pc_full_test.py`
- `backend/games/tests/views/game/pcs/detail/game_pc_money_test.py`
- `backend/games/tests/views/game/pcs/game_pc_detail_test.py`
- `backend/games/tests/views/game/npcs/game_npcs_test.py`
- `backend/games/tests/views/game/npcs/game_npcs_full_test.py`
- plus any NPC-side counterpart test files covering `_full.py`/`_money.py`/`_npc_player_update.py` that assert `X-Skip-Cache` or the removed fields (verify by grepping per edited view module)

## CI Checks

- `backend/`: `poetry run pytest games/tests/views/game/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_views_characters`)
- `backend/`: `poetry run ruff check .` (CI job: `checks`)

## Notes

- The role-simulated leniency asymmetry (money-edit's player-leniency is PC-only; photo-upload's is not) is derived directly from each permission's current `is_allowed` body — worth a second look during review since it's easy to accidentally copy the wrong sibling's shape, but this is not a new behavior, only exposing the existing rule through the role-simulated path.
- `data-access` review should be invoked once implemented, since this changes which serializer fields are present on existing endpoints and adds fields to an existing permissions endpoint.
