# Backend Plan: Add a can_exchange_document permission flag to gate the character Documents exchange button

Main plan: [plan.md](plan.md)

## Shared contracts

- `GET /permissions/game_pc.json` and `GET /permissions/game_npc.json` gain a new boolean field
  `can_exchange_document`.
- Value: `true` for dm/admin (always), staff and player of the game; `false` for anonymous users,
  users outside the game, and the `?role=owner` simulation (owner is not in `regular.create`).
  Role-simulated requests (`?role=staff|player|owner`) follow the same dual path as every other
  flag on these endpoints.
- Roles must mirror `regular.create` in `game_pc_document/endpoints.yml` /
  `game_npc_document/endpoints.yml` (`staff`, `player`), the tier that gates the plain
  `documents/acquire.json` / `documents/remove.json` endpoints.
- The frontend reads it from the character permissions payload (`AccessStore.ensureCharacterPermissions`)
  and exposes it on the page-level character object as `character.can_exchange_document`
  (fail-closed: missing → `false`).

## Implementation Steps

### Step 1 — Add the `exchange` UI permission and page mapping
Mirror the `can_exchange_recipe` wiring from #1459 (commit `ccf0a84b`). No view or serializer
code should be needed. The shared permissions builder already produces the real-identity vs.
role-simulated dual path and the dm/admin bypass.

- Create `backend/permissions/config/game_pc_document/ui.yml` and
  `backend/permissions/config/game_npc_document/ui.yml`, each with:
  ```yaml
  # CharacterPermissionsSerializer's can_exchange_document, for a PC (resp. NPC).
  # Must mirror game_pc_document/endpoints.yml's `regular.create`.
  exchange:
    - staff
    - player
  ```
- Add a reciprocal comment to both `endpoints.yml` files ("Keep `regular.create` identical to
  `game_*_document/ui.yml`'s `exchange`"). Leave the role lists unchanged.
- Add `game_pc_document: { exchange: can_exchange_document }` to
  `backend/permissions/config/pages/character_pc.yml` and
  `game_npc_document: { exchange: can_exchange_document }` to `character_npc.yml`.

Tests, following the `can_exchange_recipe` additions:
- `backend/games/tests/views/permissions/game_pc_permissions_test.py` /
  `game_npc_permissions_test.py`: add `can_exchange_document` to every expected payload (false
  for anonymous/outsider/`role=owner`, true for dm/admin/staff/player). Update any docstring that
  lists the flags excluded for `role=owner`. Add
  `test_can_exchange_document_follows_regular_create` with the
  `{'role=staff': True, 'role=player': True, 'role=owner': False, '': False}` matrix.
- `backend/permissions/tests/page_config_store_test.py`: extend the `character_pc` /
  `character_npc` resource-key sets with `game_pc_document` / `game_npc_document`, and assert
  `config['game_pc_document']['exchange'] == 'can_exchange_document'`. Update the docstring counts.
- `backend/permissions/tests/builder_test.py`: add `'can_exchange_document': True` where
  `can_exchange_recipe` was added.

### Step 2 — Document the flag
- `docs/agents/access-control/character.md`: add `can_exchange_document` (linking to
  `character-document.md#permissions`) to the list of flags that `GET /permissions/game_pc.json` /
  `game_npc.json` exposes, next to `can_exchange_recipe`.
- `docs/agents/access-control/character-document.md`: add a `## Permissions` section modeled on
  `character-recipe.md#permissions`. It covers `endpoints.yml`'s `regular.create` (plain
  acquire/remove), `ui.yml`'s `exchange` and the requirement that the two lists match, and
  `can_exchange_document` gating the frontend Exchange trigger. Keep the existing acquire/remove
  table as is.

## Files to Change
- `backend/permissions/config/game_pc_document/ui.yml` — new, `exchange: [staff, player]`
- `backend/permissions/config/game_npc_document/ui.yml` — new, `exchange: [staff, player]`
- `backend/permissions/config/game_pc_document/endpoints.yml` — mirroring comment only
- `backend/permissions/config/game_npc_document/endpoints.yml` — mirroring comment only
- `backend/permissions/config/pages/character_pc.yml` — map `game_pc_document.exchange`
- `backend/permissions/config/pages/character_npc.yml` — map `game_npc_document.exchange`
- `backend/games/tests/views/permissions/game_pc_permissions_test.py` — new flag expectations
- `backend/games/tests/views/permissions/game_npc_permissions_test.py` — new flag expectations
- `backend/permissions/tests/page_config_store_test.py` — new resource keys
- `backend/permissions/tests/builder_test.py` — new flag
- `docs/agents/access-control/character.md` — list the flag
- `docs/agents/access-control/character-document.md` — new Permissions section

## CI Checks
- `backend/`: `docker-compose run --rm majora_tests pytest` and ruff (CI jobs:
  `pytest_views_characters`, `pytest_views_rest`, `pytest_all`, `checks`)

## Notes
- If the builder turns out to require `ui.yml` for anything else (for example, other actions such as
  `create_update` used by `game_pc_possession`), only add `exchange`. Do not invent actions.
- No new endpoints, so there are no Navi cache or proxy changes. The `data-access` / `security`
  reviewers may still want to look at it, because it changes the permissions payload.
