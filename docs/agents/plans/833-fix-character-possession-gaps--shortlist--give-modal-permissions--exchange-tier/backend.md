# Backend Plan: Fix character possession gaps: shortlist, give-modal permissions, exchange tier

Main plan: [plan.md](plan.md)

## Shared contracts

None — this is a self-contained permission-tier fix on already-existing endpoints (`/possessions/acquire.json`, `/possessions/remove.json`, and their `/all.json` counterparts). No request/response shape changes, no new routes. The frontend already sends the correct `regular`/`private` variant; nothing for it to consume from this change.

## Implementation Steps

### Step 1 — Vary `_check_possession_create`'s tier by endpoint variant

In `backend/games/views/game/_possession_exchange.py`, `_check_possession_create` currently always checks `('restricted', 'create')` regardless of which endpoint hit it:

```python
def _check_possession_create(request, game, character):
    return EndpointPermission(request.user, game=game, pc=character).check(
        request, _character_possession_resource(character), 'restricted', 'create',
    )
```

Change it to take a `tier` argument and vary by endpoint, mirroring `_document_exchange.py`'s `_check_document_create(request, game, character, tier)`:

```python
def _check_possession_create(request, game, character, tier):
    return EndpointPermission(request.user, game=game, pc=character).check(
        request, _character_possession_resource(character), tier, 'create',
    )
```

Update `character_possession_acquire` and `character_possession_remove` to select the tier the same way `character_document_acquire`/`character_document_remove` do:

```python
tier = 'restricted' if allow_hidden else 'regular'
error_response = _check_possession_create(request, game, character, tier)
```

Update the docstring on `_check_possession_create` (and the module-level comment referencing "unlike `_document_exchange.py`'s tier... this always checks `restricted`/`create`... issue #1076") to reflect the new, document-matching behavior — that comment is now stale and should be removed/rewritten, not left contradicting the code.

### Step 2 — Add the `regular.create` permission tier to the possession config

Both config files already have a `regular:` top-level key (holding `create_update`, for the create-from-scratch flow) — add a sibling `create` action under it, alongside the existing `restricted.create`. Current content:

`backend/permissions/config/game_pc_possession/endpoints.yml`:
```yaml
restricted:
  create:
    - staff
    - owner
regular:
  create_update:
    - staff
    - player
    - owner
```
becomes:
```yaml
restricted:
  create:
    - staff
    - owner
regular:
  create:
    - staff
    - player
  create_update:
    - staff
    - player
    - owner
```

(`create`'s `regular` tier deliberately omits `owner`, matching `game_pc_document/endpoints.yml`'s own `regular.create: [staff, player]` exactly — `player` already covers any player of the game including the PC's owner; `create_update` keeps `owner` unchanged since that tier is unrelated to this fix.)

`backend/permissions/config/game_npc_possession/endpoints.yml`:
```yaml
restricted:
  create:
    - staff
regular:
  create_update:
    - staff
    - player
```
becomes:
```yaml
restricted:
  create:
    - staff
regular:
  create:
    - staff
    - player
  create_update:
    - staff
    - player
```

Both files' header comments explicitly document the current unconditional-restricted rationale ("`create` (restricted) gates the acquire/remove endpoints unconditionally... Possession follows that stricter model since possessions are narratively significant, unique belongings") — rewrite these comments to describe the new regular/restricted split instead (mirroring `game_pc_document`'s/`game_npc_document`'s own header comments), since the current text will otherwise directly contradict the new config shape.

### Step 3 — Update existing possession-exchange tests

Every test under `backend/games/tests/views/game/{pcs,npcs}/detail/possessions/` for the plain `acquire`/`remove` endpoints (`game_pc_possession_acquire_test.py`, `game_pc_possession_remove_test.py`, `game_npc_possession_acquire_test.py`, `game_npc_possession_remove_test.py`) currently asserts staff/player/plain-player behavior against the old unconditionally-restricted permission. Update the expectations to match `game_pc_document_acquire_test.py`'s/`game_npc_document_acquire_test.py`'s pattern (or `game_pc_document_remove_test.py`'s, if such a file exists — locate the precedent test file for documents' plain acquire/remove endpoints and mirror its permission-matrix assertions exactly):

- Plain endpoint (`/possessions/acquire.json`, `/possessions/remove.json`): admin, dm, staff, the PC's owning player, and (per the `regular` tier) any player of the game should now succeed where they previously got 403.
- `/all.json` variant: unchanged — still admin/dm/staff (PC) or admin/dm/staff (NPC) only, since `restricted.create` is untouched.

The `/all.json`-variant test files (`game_pc_possession_acquire_all_test.py`, `game_pc_possession_remove_all_test.py`, `game_npc_possession_acquire_all_test.py`, `game_npc_possession_remove_all_test.py`) should need no changes — their tier is unaffected by this change.

## Files to Change

- `backend/games/views/game/_possession_exchange.py` — `_check_possession_create` gains a `tier` param; `character_possession_acquire`/`character_possession_remove` select `regular`/`restricted` off `allow_hidden`, mirroring `_document_exchange.py`; stale docstring/comment updated.
- `backend/permissions/config/game_pc_possession/endpoints.yml` — add `regular.create: [staff, player]`.
- `backend/permissions/config/game_npc_possession/endpoints.yml` — add `regular.create: [staff, player]`.
- `backend/games/tests/views/game/pcs/detail/possessions/game_pc_possession_acquire_test.py` — update permission-matrix assertions for the plain endpoint.
- `backend/games/tests/views/game/pcs/detail/possessions/game_pc_possession_remove_test.py` — same.
- `backend/games/tests/views/game/npcs/detail/possessions/game_npc_possession_acquire_test.py` — same.
- `backend/games/tests/views/game/npcs/detail/possessions/game_npc_possession_remove_test.py` — same.

## CI Checks

- `backend`: `poetry run pytest games/tests/views/game/` (CI job: `pytest_views_characters`)
- `backend`: `poetry run ruff check .` — line-length-100 lint, per `AGENTS.md`'s "ruff (linting, line length 100)"

## Notes

- No migration needed — this is permission-config and view-logic only, no model/schema changes.
- Double-check whether any other test (e.g. `game_pc_permissions_test.py`/`game_npc_permissions_test.py`, which PR #1102 already touched once for possessions) asserts on the possession `restricted`/`create` shape and needs a matching update for the new `regular` tier.
