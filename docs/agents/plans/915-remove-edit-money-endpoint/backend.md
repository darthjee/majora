# Backend Plan: Remove edit money endpoint

Main plan: [plan.md](plan.md)

## Shared contracts

- Removing `PUT /games/:game_slug/pcs/:id/money.json` and `PUT /games/:game_slug/npcs/:id/money.json` (they must 404 afterward — routes deleted, not just deprecated).
- PC PATCH (`/games/:game_slug/pcs/:id.json`) already accepts `money`; no serializer/permission change needed there.
- NPC PATCH (`/games/:game_slug/npcs/:id.json`) must start accepting `money`, and its permission action (`game_npc`/`player_edit`) must add `staff` to its role list.
- `permissions.json` must stop returning `can_edit_money` for both `character_pc` and `character_npc`.

## Implementation Steps

### Step 1 — Make `money` writable on NPC PATCH

Add `'money'` to `NpcPlayerUpdateSerializer.Meta.fields` in `backend/games/serializers/characters/npcs/npc_player_update.py:28`, and update its docstring (lines 16-18 currently say `money` stays `full.json`-only — that's no longer true).

### Step 2 — Broaden NPC PATCH permission to include staff

In `backend/games/permissions/config/game_npc/endpoints.yml`, add `staff` to the `player_edit` role list (currently only `player`, lines 18-19).

### Step 3 — Remove the `money_edit` endpoint-gating action

Remove the `money_edit` action block entirely from:
- `backend/games/permissions/config/game_pc/endpoints.yml` (lines 13-16)
- `backend/games/permissions/config/game_npc/endpoints.yml` (lines 12-13)

### Step 4 — Remove `can_edit_money` from `permissions.json`

Remove the `money_edit` role list from `backend/games/permissions/config/game_pc/ui.yml` (lines 4-7) and `backend/games/permissions/config/game_npc/ui.yml` (lines 3-4), and remove the `money_edit: can_edit_money` line from `backend/games/permissions/config/pages/character_pc.yml:4` and `backend/games/permissions/config/pages/character_npc.yml:4`. No Python changes needed — `PermissionsBuilder`/`ResourcePermissionsResolver`/`CharacterPermissionsSerializer` are purely data-driven off these yml files.

### Step 5 — Delete the money-only endpoint and its wiring

Delete:
- `backend/games/views/game/pcs/detail/game_pc_money.py`
- `backend/games/views/game/npcs/detail/game_npc_money.py`
- `backend/games/views/game/_money.py` (the `character_money_update` view logic and its `_check_money_edit`-style permission check)
- `backend/games/serializers/characters/character_money_update.py` (`CharacterMoneyUpdateSerializer`)

Remove `build_money_view` from `backend/games/views/game/_character_shared.py:115-125` and its import at line 45, if nothing else uses it after PC/NPC money views are gone.

Remove the `('/money.json', 'money')` route entry from `_CHARACTER_ROUTES` in `backend/games/urls/_character_routes.py:8`.

Remove all `game_pc_money`/`game_npc_money` imports and re-exports:
- `backend/games/views/game/pcs/__init__.py:13,45`
- `backend/games/views/game/npcs/__init__.py:13,50`
- `backend/games/views/game/__init__.py:27,69,99,100`
- `backend/games/views/__init__.py:28,68,190,191`

Remove `CharacterMoneyUpdateSerializer` from `backend/games/serializers/__init__.py:30,136`.

### Step 6 — Update/remove tests

- Delete `backend/games/tests/views/game/pcs/detail/game_pc_money_test.py` and `backend/games/tests/views/game/npcs/detail/game_npc_money_test.py` (whole files test the removed endpoints).
- `backend/games/tests/permissions/resource_resolver_test.py:27` — update the `action_map` fixture to drop the `money_edit`/`can_edit_money` pairing (or repoint it at a still-existing action if the test needs two entries).
- `backend/games/tests/permissions/builder_test.py:33` — remove the `'can_edit_money': True` assertion.
- `backend/games/tests/views/game/pcs/detail/game_pc_permissions_test.py` — remove all `can_edit_money` assertions (lines 49, 61, 135, 149, 167, 181, 198, 212).
- `backend/games/tests/views/game/npcs/detail/game_npc_permissions_test.py` — remove all `can_edit_money` assertions (lines 48, 60, 143, 157, 174, 188).
- `backend/games/tests/serializers/characters/npcs/npc_player_update_test.py:102-107` — flip `test_money_is_not_writable` into a `test_money_is_writable` test (mirroring the PC equivalent in `character_regular_update_test.py`), since `money` is now accepted.
- `backend/games/tests/views/game/npcs/game_npc_detail_test.py:377-403` — `test_patch_ignores_non_editable_fields` currently includes `money: 999` and asserts it's ignored; update it to remove `money` from the "ignored" set (or move it to a "writable" assertion), and add a case verifying `money` is actually persisted via PATCH.
- `backend/games/tests/views/game/npcs/game_npc_detail_test.py` (`TestGameNpcPlayerUpdateView`, from line 195) — add a test that a `staff` (non-admin/dm) user can PATCH an NPC successfully (mirroring the equivalent PC staff coverage), since no staff-specific NPC-PATCH test exists today.

## CI Checks
- `backend`: `poetry run pytest games/tests/views/game/ --cov` and `poetry run pytest games/tests/ --ignore=games/tests/views/ --cov` (CI jobs: `pytest_views_characters`, `pytest_all`) — run via `make dev` / `make tests` per project convention (never invoke `poetry` directly on the host).
- `backend`: `poetry run ruff check .` (CI job: `checks`).

## Notes
- Double-check nothing else in the codebase imports `character_money_update`, `CharacterMoneyUpdateSerializer`, or `build_money_view` before deleting (`grep -r` across `backend/`) — the exploration only found the call sites listed above, but re-verify at implementation time since files may have shifted.
- `docs/agents/access-control/character.md` and `docs/agents/product/entities/ownership-and-roles.md` document the current (soon to be old) money-endpoint behavior (issues #615/#625) — these should be updated to reflect the new PATCH-based behavior and the NPC `staff` permission broadening, even though this is a docs change rather than code.
