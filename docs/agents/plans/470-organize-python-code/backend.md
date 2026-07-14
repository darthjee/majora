# Backend Plan: Organize Python code

Main plan: [plan.md](plan.md)

## Shared contracts

CI depends on the final test location for the moved character/PC/NPC views: all of
`backend/games/tests/views/characters/*` must end up under
`backend/games/tests/views/game/pcs/` and `backend/games/tests/views/game/npcs/` (see
[plan.md](plan.md)'s "Shared contracts"). Don't scatter these tests elsewhere — `infra`
depends on `games/tests/views/game/` covering the full set.

## Implementation Steps

### Step 1 — Split `urls.py` into a hub + per-resource modules

Turn `backend/games/urls.py` into a package `backend/games/urls/` whose `__init__.py`
concatenates each module's `urlpatterns` (Django's `include('games.urls')` in
`majora_project/urls.py` works unchanged against a package as long as `urlpatterns` is
exposed at `games/urls/__init__.py`). Suggested split, grouping the current 199 lines by
resource:

- `urls/games.py` — games' own actions + sub-resources not restructured in this issue
  (`games.json`, `games/<slug>.json`, `access.json`, `permissions.json`, `treasures.json`,
  `treasures/all.json`, `treasures/<id>.json`, `photos.json`, `sessions.json`,
  `sessions/<id>.json`, `tasks.json`, `tasks/<id>.json`, `game-masters.json`,
  `game-masters/<id>.json`, `photo_upload.json`).
- `urls/pcs.py` — every `games/<slug>/pcs...` route.
- `urls/npcs.py` — every `games/<slug>/npcs...` route (including `npcs/all.json`).
- `urls/treasures.py` — top-level `treasures.json`, `treasures/<id>.json`, `.../access.json`,
  `.../permissions.json`, `.../photo_upload.json`.
- `urls/uploads.py` — `uploads/<id>.json`.
- `urls/staff.py` — `staff/users...` routes.
- `urls/auth.py` — `users/...` routes (login, logout, register, status, test-email,
  recover, reset-password, language, account).
- `urls/system.py` — `health.json`, `ready.json`, `access-route-config.json`.

Each module imports only the views it needs from `.. import views` (or the new nested
view packages once Step 2 lands) and exposes its own `urlpatterns` list; `urls/__init__.py`
imports each module and does `urlpatterns = games.urlpatterns + pcs.urlpatterns + ...` in
the same order as today's file so route resolution order is unchanged. This split is a
judgment call on grouping — keep it consistent, but exact module boundaries aren't
load-bearing as long as every route survives with its existing path and `name=`.

### Step 2 — Migrate `views/characters/` to `views/game/pcs/` + `views/game/npcs/`

Follow [`docs/agents/views-organization.md`](../views-organization.md) exactly (this is
the slice #348 calls out as "the folder that motivated the convention"):

- **Keep every filename as-is** (rule 5) — only the folder location changes. Do not rename
  `game_pc_full.py` to `full.py` etc.
- `game/pcs/` and `game/npcs/` hold each resource's own list/detail actions directly:
  `game_pcs.py` (list), `game_pc_detail.py` (detail), and the `npc_` equivalents
  (`game_npcs.py`, `game_npcs_all.py`, `game_npc_detail.py`).
- `game/pcs/detail/` and `game/npcs/detail/` hold member actions on a single item per the
  doc's rule 3 examples: `game_pc_full.py`, `game_pc_access.py`, `game_pc_permissions.py`,
  `game_pc_photo_upload.py` (and `npc_` equivalents).
- Recursive nesting (rule 4) for the two nested sub-collections on a single character:
  - `game/pcs/detail/photos/` — `game_pc_photos.py` (list) and `game_pc_photo_set.py`
    (the doc's own worked example: `pcs/:id/photos/:photo_id/set.json` →
    `game/pcs/detail/photos/game_pc_photo_set.py`).
  - `game/pcs/detail/treasures/` — `game_pc_treasures.py` (list), `game_pc_treasure_acquire.py`,
    `game_pc_treasure_sell.py`.
  - Same shape under `game/npcs/detail/photos/` and `game/npcs/detail/treasures/`.
  - **Note:** the doc's worked-examples table doesn't spell out this exact photos/treasures
    split verbatim — it's the closest consistent generalization of rules 3+4. Flag for
    review if it looks off once you're looking at the actual private helpers.
- Move the shared private helpers (`_shared.py`, `_detail.py`, `_full.py`,
  `_npc_slain_update.py`, `_photo_set.py`, `_photo_upload.py`, `_photos.py`,
  `_treasure_exchange.py`, `_treasures.py`) to whichever new location their callers now
  live in — split them per pcs/npcs if their logic actually differs, or keep one shared
  module imported by both if the logic is identical (check each before duplicating).
- Update every `__init__.py` along the way (`views/__init__.py`, `views/game/__init__.py`,
  `views/game/pcs/__init__.py`, `views/game/pcs/detail/__init__.py`, etc.) so
  `views/__init__.py`'s public re-exports and `__all__` list are unchanged externally —
  `from . import views` callers (urls modules) must not need any name changes, only the
  import paths inside `views/__init__.py` change.
- Mirror the identical tree under `backend/games/tests/views/` (rule 6), one test file per
  view file, moving `backend/games/tests/views/characters/*` into
  `backend/games/tests/views/game/pcs/` and `backend/games/tests/views/game/npcs/`
  accordingly. This is the path `infra`'s CI job depends on (see Shared contracts above).
- Delete `views/characters/` and `tests/views/characters/` once empty.

### Step 3 — Reorganize `serializers/` by resource

No documented convention exists yet for serializers — apply the same underlying
principle (group by resource, split PC/NPC only where the code actually differs), since
`Character` is one model and most `character_*` serializers serve both PCs and NPCs
generically:

- `serializers/characters/` — `character_access.py`, `character_create.py`,
  `character_detail.py`, `character_full_list.py`, `character_full.py`,
  `character_link_write.py`, `character_link.py`, `character_list.py`,
  `character_permissions.py`, `character_photo.py`, `character_treasure.py`,
  `character_update.py`.
  - `serializers/characters/pcs/` — `pc_access.py` (the one genuinely PC-only serializer).
  - `serializers/characters/npcs/` — `npc_slain_update.py` (the one genuinely NPC-only
    serializer).
- `serializers/games/` — `game_access.py`, `game_create.py`, `game_detail.py`,
  `game_list.py`, `game_permissions.py`, `game_photo.py`, `game_update.py`,
  `game_master.py`.
  - `serializers/games/sessions/` — `game_session_create.py`, `game_session_detail.py`,
    `game_session_list.py`, `game_session_update.py`.
  - `serializers/games/tasks/` — `game_task_create.py`, `game_task_list.py`,
    `game_task_update.py`.
  - `serializers/games/treasures/` — `game_treasure_fields.py`, `game_treasure_update.py`.
- `serializers/treasures/` — `treasure_access.py`, `treasure_create.py`,
  `treasure_detail.py`, `treasure_list.py`, `treasure_permissions.py`, `treasure_update.py`.
- `serializers/staff/` — `staff_user_detail.py`, `staff_user_list.py`,
  `staff_user_update.py`.
- `serializers/auth/` — `my_account_detail.py`, `my_account_update.py`.
- Stay at the top level (cross-cutting, not resource-specific): `base_access.py`,
  `base_permissions.py`, `link.py`, `photo_upload.py`.
- Update `serializers/__init__.py` re-exports accordingly, and fix the two known direct
  submodule imports that will break:
  `games/tests/serializers/character_update_test.py` and
  `character_create_test.py` both do
  `from games.serializers.character_link_write import MAX_LINKS` — update to the new path
  (`games.serializers.characters.character_link_write`).
- Mirror the same folder split under `backend/games/tests/serializers/`.

### Step 4 — Reorganize `models/` by resource

There is **no** PC/NPC model split to mirror — `Character` is a single model (the `npc`
boolean field distinguishes them) — so do not force a `pcs/`/`npcs/` folder here:

- `models/character/` — `character.py`, `character_link.py`, `character_photo.py`,
  `character_treasure.py`.
- `models/game/` — `game.py`, `game_photo.py`, `game_session.py`, `game_master.py`,
  `game_treasure.py`, `player.py`.
- `models/treasure/` — `treasure.py`, `treasure_photo.py`.
- Stay at the top level (cross-cutting/standalone): `link.py`, `upload.py`,
  `user_profile.py`, `password_reset_token.py`, `task.py`.
- Update `models/__init__.py` re-exports so `from .models import Character` (used in
  `admin.py` and elsewhere) keeps working unchanged.
- Mirror the same folder split under `backend/games/tests/models/`.
- Double-check `versioning/` app: it references tracked models
  (`Game`, `Player`, `Character`, `Treasure`, `CharacterTreasure`, `GamePhoto`,
  `CharacterPhoto`, `Link`, `CharacterLink`, `TreasurePhoto`) — confirm it imports via
  `games.models` (the package), not a submodule path, so it's unaffected.
- **Do not generate a new migration.** Moving model *files* while keeping the same class
  `Meta.app_label`/table names and `models/__init__.py` re-exports is a pure Python
  reorganization; Django's migration state doesn't reference file paths. Run
  `makemigrations --check --dry-run` as a safety net (see CI Checks) to confirm no
  migration is produced.

### Step 5 — Document the new serializers/models conventions

Add the folder convention from Steps 3–4 to the docs, mirroring
`docs/agents/views-organization.md`'s style (either as new sibling docs, e.g.
`docs/agents/serializers-organization.md` and `docs/agents/models-organization.md`, or a
combined doc) — resource folder, PC/NPC sub-split only where the underlying code
actually varies, worked examples, and stability of public re-exports. Add the new doc(s)
to the table in root `AGENTS.md`.

### Step 6 — Full regression pass

Run the full backend test suite and linter locally before considering this done — this
touches nearly every file in `backend/games/{views,serializers,models}` and `urls.py`,
so a green run end-to-end is the only real correctness signal for a "pure reorg."

## Files to Change

- `backend/games/urls.py` → `backend/games/urls/__init__.py` + `urls/{games,pcs,npcs,treasures,uploads,staff,auth,system}.py`
- `backend/games/views/characters/*` → `backend/games/views/game/{pcs,npcs}/...` (per Step 2)
- `backend/games/views/__init__.py`, `backend/games/views/game/__init__.py` (new) — re-exports
- `backend/games/tests/views/characters/*` → `backend/games/tests/views/game/{pcs,npcs}/...`
- `backend/games/serializers/*` → resource sub-folders (per Step 3), `serializers/__init__.py`
- `backend/games/tests/serializers/character_update_test.py`, `character_create_test.py` — fix `MAX_LINKS` import path
- `backend/games/tests/serializers/*` → mirrored resource sub-folders
- `backend/games/models/*` → resource sub-folders (per Step 4), `models/__init__.py`
- `backend/games/tests/models/*` → mirrored resource sub-folders
- `docs/agents/serializers-organization.md`, `docs/agents/models-organization.md` (new)
- `AGENTS.md` — add the two new docs to the documentation table

## CI Checks

- `backend`: `poetry run pytest --cov` (CI jobs: `pytest_views_characters`, `pytest_views_rest`, `pytest_all` — see [infra.md](infra.md) for the path updates these jobs need)
- `backend`: `poetry run ruff check .` (CI job: `checks`)
- `backend`: `poetry run python manage.py makemigrations --check --dry-run` — safety net confirming Step 4 produced no migration

## Notes

- This is a large, mechanical diff touching nearly every file under `backend/games/{views,serializers,models}` plus `urls.py` and their test mirrors. Consider whether to split delivery into smaller PRs (views, then serializers, then models) as #348 itself suggested for its own follow-ups — the issue file doesn't mandate one PR, so use judgment when implementing.
- The exact depth of `detail/photos/` vs `detail/treasures/` nesting in Step 2 is this plan's best-effort generalization of `views-organization.md`'s rules, not a verbatim worked example from that doc — sanity-check it against the actual private helper files before finalizing.
- No behavior change anywhere: URL paths, route `name=` values, public view/serializer/model names, and all existing tests must be unaffected except for internal import paths.
