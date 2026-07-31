# Plan: Improve permissions serializers

Issue: [912-improve-permissions-serializers.md](../../issues/912-improve-permissions-serializers.md)

## Overview

Replace the repetitive `_get_can_*`/`_ui_permission` methods in `CharacterPermissionsSerializer`, `GamePermissionsSerializer`, and `TreasurePermissionsSerializer` with a shared, YAML-driven builder that reuses `UIPermission`. Each `permissions.json` endpoint gets one new "page" YAML file mapping `resource -> {UIPermission action: response key}`; a builder loads that file, resolves every resource entry through `UIPermission`, and merges the results into the full response hash (including `can_edit`). This is backend-only work — all touched code lives under `backend/games/`.

## Context

- `UIPermission` (`backend/games/permissions/ui.py`) already checks a `(resource, action)` pair against YAML config loaded/cached by `PermissionConfigStore` (`backend/games/permissions/config_store.py`), keyed by resource under `backend/games/permissions/config/<resource>/{ui,endpoints}.yml`.
- `BasePermission` (`backend/games/permissions/base.py`) resolves an admin/dm shortcut plus role checks from a `Roles` object (`backend/games/permissions/roles.py`), which can be either DB-resolved (`user`/`game`/`pc`) or built from explicit booleans via `Roles.from_booleans` (the `?role=` simulated-preview path).
- Three serializers currently hand-roll this per attribute:
  - `backend/games/serializers/characters/character_permissions.py` (`CharacterPermissionsSerializer`, shared by PC and NPC endpoints) — 6 `can_*` keys, resource varies by `character.is_pc` (`game_pc`/`game_npc`, `game_pc_item`/`game_npc_item`).
  - `backend/games/serializers/games/game_permissions.py` (`GamePermissionsSerializer`) — 5 `can_*` keys, single fixed resource `'game'`.
  - `backend/games/serializers/treasures/treasure_permissions.py` (`TreasurePermissionsSerializer`) — only `can_edit`, and does **not** use `UIPermission` today; it calls `Treasure.can_be_edited_by`/`can_be_edited_by_roles` directly.
  - All three extend `BasePermissionsSerializer` (`backend/games/serializers/base_permissions.py`), which currently owns the `can_edit`-only default `to_representation` and the `_roles()`/`_user()` context helpers (from `RequestContextSerializerMixin`).
- Per the issue's confirmed scope: treasure is included, and the builder's output becomes the **entire** response body for all three serializers (no leftover ad hoc `can_edit` handling in `BasePermissionsSerializer`).
- **Treasure is expressible through `UIPermission` without new mechanics.** Today: `Treasure.can_be_edited_by` = superuser, or staff *only if* `game_id is None`; `can_be_edited_by_roles` = superuser or (`game_id is not None` and dm); the real-user path additionally falls back to `treasure.game.can_be_edited_by(user)`, which is itself just `Game.can_be_edited_by` = superuser or dm-of-game (`backend/games/models/game/game.py:47-56`). Since `BasePermission._shortcut_allows` already grants on `is_admin() or is_dm()` whenever a `game` is passed to `UIPermission`, constructing `UIPermission(user=..., game=treasure.game)` (or the role-simulated equivalent) and checking action `edit` (roles: `[staff]`) when `treasure.game_id is None`, or `edit_scoped` (roles: `[]`) when it isn't, reproduces today's behavior exactly — it's the same two-action shape already used in `backend/games/permissions/config/treasure/endpoints.yml`'s `restricted.edit`/`restricted.edit_scoped`. This needs a new `backend/games/permissions/config/treasure/ui.yml` mirroring that file.
- Character's PC/NPC resource split has an existing precedent to copy exactly: `config/game_pc/ui.yml` and `config/game_npc/ui.yml` already exist as two separate files with the same action names but different allowed roles. The new page-level YAML should follow the same pattern — two page files (`character_pc`, `character_npc`) rather than inventing a logical-resource-name-to-concrete-resource-name indirection.
- Existing tests to extend/keep passing: `backend/games/tests/views/game/pcs/detail/game_pc_permissions_test.py`, `.../npcs/detail/game_npc_permissions_test.py`, `backend/games/tests/views/games/game_permissions_test.py`, `backend/games/tests/views/treasures/treasure_permissions_test.py`, plus `backend/games/tests/permissions/` (unit tests for the permissions module itself).

## Implementation Steps

### Step 1 — Page-level YAML config

Add a new config root for page-level (endpoint-response) mappings, separate from the existing per-resource `config/<resource>/{ui,endpoints}.yml`: `backend/games/permissions/config/pages/<page_key>.yml`. Each file's top-level keys are `UIPermission`-recognized resource names; each nested key/value is `<UIPermission action>: <response key>`, per the issue's sample format:

```yml
game_pc_item:
  create_update: can_create_item
```

Create one file per page:
- `config/pages/character_pc.yml` — resources `game_pc` (`edit` → `can_edit`, `money_edit` → `can_edit_money`, `treasure_exchange` → `can_exchange_treasure`, `photo_upload` → `can_set_profile_photo`, `photo_delete` → `can_delete_photo`) and `game_pc_item` (`create_update` → `can_create_item`, `photo_upload` → `can_upload_item_photo`).
- `config/pages/character_npc.yml` — same shape, resources `game_npc`/`game_npc_item`.
- `config/pages/game.yml` — resource `game` (`edit` → `can_edit`, `create_item` → `can_create_item`, `create_document` → `can_create_document`, `edit_session` → `can_edit_session`, `create_npc` → `can_create_npc`).
- `config/pages/treasure.yml` — resource `treasure`, actions `edit`/`edit_scoped`, both → `can_edit` (only one of the two is ever queried per request, see Step 4).

Also add `backend/games/permissions/config/treasure/ui.yml` (new — treasure has no `ui.yml` today, only `endpoints.yml`), mirroring `endpoints.yml`'s `restricted.edit: [staff]` / `restricted.edit_scoped: []`, but flattened (no `restricted:` nesting, matching every other resource's `ui.yml` shape):

```yml
edit:
  - staff
edit_scoped: []
```

### Step 2 — Page config loader

Add `backend/games/permissions/page_config_store.py` with a `PagePermissionConfigStore` class, mirroring `PermissionConfigStore`'s shape (in-class `_cache` dict, `get(page_key)` returning a `copy.deepcopy`, `_load` reading `config/pages/<page_key>.yml` via `yaml.safe_load`). Keep it a distinct class rather than overloading `PermissionConfigStore`, since the two live under different subtrees (`config/<resource>/...` vs `config/pages/...`) and are conceptually different (per-resource vs per-endpoint-response).

### Step 3 — Resource resolver

Add `backend/games/permissions/resource_resolver.py` with a class (e.g. `ResourcePermissionsResolver`) that takes: a resource key, that resource's parsed action-map (`{action: response_key}`), and either `(user, game, pc)` or a `roles=` override. It builds one `UIPermission` (honoring `roles=` exactly like today's per-serializer `_ui_permission` helpers) and returns `{response_key: bool}` by calling `.allowed(resource, action)` once per entry.

### Step 4 — Builder

Add `backend/games/permissions/builder.py` with a `PermissionsBuilder` (or similar) taking `user`, `game`, `pc`, `page_key`, and an optional `roles=` override. It:
1. Loads the page config via `PagePermissionConfigStore.get(page_key)`.
2. For each top-level resource key, calls the Step 3 resolver and merges the returned dict into the final result.
3. Returns the merged hash.

For treasure specifically, the calling serializer picks `edit` vs `edit_scoped` as the *only* action present in the resource map it hands to the resolver (or the builder/resolver skips whichever key doesn't apply) based on `treasure.game_id is None`, and passes `game=treasure.game` through — do not query both and merge, since only one is behaviorally correct per treasure. Confirm the simplest way to thread this through the shared builder (e.g. the treasure serializer builds its own single-action resource map from the loaded YAML rather than iterating both) without special-casing the builder/resolver themselves.

Export the three new classes from `backend/games/permissions/__init__.py` alongside the existing ones.

### Step 5 — Rewire the three serializers

- `CharacterPermissionsSerializer`: replace `to_representation` and all `_get_can_*`/`_ui_permission`/`_character_resource`/`_character_item_resource` methods with a call to the builder using `page_key='character_pc' if obj.is_pc else 'character_npc'`.
- `GamePermissionsSerializer`: replace `to_representation`/`_get_can_*`/`_ui_permission` with a call to the builder using `page_key='game'`.
- `TreasurePermissionsSerializer`: replace `_get_can_edit`/`_get_can_edit_for_real_user` with a call to the builder using `page_key='treasure'`, applying the `edit`/`edit_scoped` action selection from Step 4.
- Decide whether `BasePermissionsSerializer.to_representation`/`_get_can_edit` (the shared `can_edit`-only default) is still needed once all three subclasses fully own their `to_representation` — if every subclass now overrides it via the builder, simplify or remove the now-dead default rather than leaving unreachable code.
- Keep each serializer's role-simulation entry point (reading `self._roles()`/`self._user()`) — only the per-attribute plumbing moves into the builder, not the `?role=` simulated-path decision itself.

### Step 6 — Tests

- Add unit tests for the three new classes (`PagePermissionConfigStore`, the resolver, the builder) under `backend/games/tests/permissions/`, following that folder's existing test conventions.
- Update the four existing `*_permissions_test.py` view tests only if response shape/behavior changes are expected — the goal is behavior parity, so these should mostly pass unmodified; add treasure test coverage for both the global (`edit`) and game-exclusive (`edit_scoped`) paths if not already covered, since that logic is being re-expressed through YAML for the first time.
- Run the full permissions-related suite locally before considering this done (see CI Checks below).

## Files to Change

- `backend/games/permissions/config/pages/character_pc.yml` — new page config.
- `backend/games/permissions/config/pages/character_npc.yml` — new page config.
- `backend/games/permissions/config/pages/game.yml` — new page config.
- `backend/games/permissions/config/pages/treasure.yml` — new page config.
- `backend/games/permissions/config/treasure/ui.yml` — new resource config (treasure has none today).
- `backend/games/permissions/page_config_store.py` — new `PagePermissionConfigStore`.
- `backend/games/permissions/resource_resolver.py` — new resource resolver class.
- `backend/games/permissions/builder.py` — new `PermissionsBuilder`.
- `backend/games/permissions/__init__.py` — export the three new classes.
- `backend/games/serializers/characters/character_permissions.py` — rewire to the builder.
- `backend/games/serializers/games/game_permissions.py` — rewire to the builder.
- `backend/games/serializers/treasures/treasure_permissions.py` — rewire to the builder.
- `backend/games/serializers/base_permissions.py` — simplify/remove the now-unused default `can_edit`-only `to_representation`, if applicable.
- `backend/games/tests/permissions/` — new unit tests for the three new classes.
- `backend/games/tests/views/game/pcs/detail/game_pc_permissions_test.py`, `.../npcs/detail/game_npc_permissions_test.py`, `backend/games/tests/views/games/game_permissions_test.py`, `backend/games/tests/views/treasures/treasure_permissions_test.py` — verify/extend for parity, especially treasure's two edit paths.

## CI Checks

- `backend`: `poetry run pytest games/tests/views/game/ --cov` (CI job: `pytest_views_game`) — covers the character PC/NPC permissions tests.
- `backend`: `poetry run pytest games/tests/views/ --ignore=games/tests/views/game/ --cov` (CI job: `pytest_views_rest`) — covers game/treasure permissions tests.
- `backend`: `poetry run pytest --ignore=games/tests/views/ --cov` (CI job: `pytest_all`) — covers the new `backend/games/tests/permissions/` unit tests.

## Notes

- The trickiest part of this refactor is treasure: it's the only serializer not built on `UIPermission` today, and its `can_edit` logic (superuser / staff-if-global / dm-if-scoped, with the game-fallback check) collapses cleanly onto the existing admin/dm shortcut once `game=treasure.game` is threaded through — see Context above — but this equivalence should be double-checked against `treasure_permissions_test.py` before considering the migration done, since it's a behavior-preserving claim, not just a mechanical move.
- Two-file-per-PC/NPC (`character_pc.yml`/`character_npc.yml`) was chosen over a single `character.yml` with logical-to-concrete resource-name indirection, to match the existing `config/game_pc/ui.yml` vs `config/game_npc/ui.yml` precedent and avoid introducing a new resolution concept the codebase doesn't already have.
- `photo_upload` appears twice in the character page config (once under `game_pc`/`game_npc` → `can_set_profile_photo`, once under `game_pc_item`/`game_npc_item` → `can_upload_item_photo`) — this is expected; the two entries live under different resource keys in the YAML, so they don't collide.
- If, during implementation, `BasePermissionsSerializer` ends up with no remaining shared logic beyond `_roles()`/`_user()` (from the mixin) once `to_representation`/`_get_can_edit` are removed, consider whether it's still worth keeping as a base class versus each serializer using the mixin directly — a call to make once Step 5 is done, not upfront.
