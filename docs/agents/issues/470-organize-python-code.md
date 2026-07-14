# Issue: Organize Python code

## Description
The Python code for the games module (`backend/games`) has grown large and needs better organization: `urls.py`, `views/`, `serializers/`, and `models/` should all be broken down into folders that mirror the API's resource hierarchy (one folder per resource, one sub-folder per nested sub-resource).

## Problem
- `backend/games/urls.py` is a single flat file (~200 lines) listing every route for every resource (games, characters, treasures, staff, auth, uploads, etc.), making it hard to see which routes belong to which resource.
- `backend/games/views/` already documents a target folder convention in `docs/agents/views-organization.md` (born from issue #348): a plural resource folder for a resource's own actions, a sibling singular `game/` folder for resources nested under a specific game (`game/pcs/`, `game/npcs/`, `game/treasures/`, ...), a `detail/` subfolder for member actions on a single item, recursively nested where needed. That convention is documented but not yet applied — `views/characters/` still mixes PC and NPC view files flatly (`game_pc_detail.py`, `game_npc_detail.py`, `game_pc_access.py`, `game_pc_full.py`, `game_pc_treasures.py`, `game_pc_treasure_acquire.py`/`_sell.py`, `game_pc_photo_upload.py`, `game_pc_photo_set.py`, `game_pc_photos.py`, and their `npc_` equivalents) instead of the documented `game/pcs/`+`game/npcs/` shape.
- `backend/games/serializers/` and `backend/games/models/` are entirely flat directories with no per-resource folder structure at all, mixing files for every resource (character, game, treasure, link, upload, ...) side by side, and have no documented convention at all.

## Expected Behavior
- `backend/games/urls.py` acts as a hub that composes URL patterns from per-resource files/folders (mirroring the views folder structure), instead of declaring every route inline.
- `backend/games/views/characters/` is migrated to the shape already documented in `docs/agents/views-organization.md`: `game/pcs/` and `game/npcs/`, with `detail/` for member actions (`full`, `access`, `permissions`, `treasures`, `photo_upload`, `photo_set`) and further nesting for `photos/`. Filenames are kept as-is per that document's rule #5 — only their folder location changes.
- `backend/games/serializers/` and `backend/games/models/` get an equivalent folder-per-resource structure, adapted to how those layers actually vary by sub-resource (see Solution) rather than forcing an artificial pcs/npcs split where the underlying code doesn't have one.

## Solution
- Introduce per-resource URL modules (e.g. `urls/games.py`, `urls/characters.py`, `urls/treasures.py`, ...) and have `backend/games/urls.py` import and concatenate their `urlpatterns`.
- Restructure `backend/games/views/characters/` into `game/pcs/` and `game/npcs/` exactly per `docs/agents/views-organization.md` (this is the slice #348 called out as the folder that motivated the convention): keep existing filenames, add a `detail/` subfolder for member actions, and nest `photos/` recursively under `detail/`. Mirror the same tree under `backend/games/tests/views/`.
- For `backend/games/serializers/`: most `character_*` serializers (access, create, detail, full, list, permissions, photo, treasure, update, link, ...) serve both PCs and NPCs generically off the single `Character` model, so they group under a `characters/` folder; only the genuinely PC-only/NPC-only ones (`pc_access.py`, `npc_slain_update.py`) go under `characters/pcs/` / `characters/npcs/` respectively. Other resources (`game_*`, `treasure_*`, `staff_user_*`, `game_session_*`, `game_task_*`) each get their own folder.
- For `backend/games/models/`: there is no PC/NPC model split to mirror — `Character` is a single model (the `npc` boolean field distinguishes them), so no `pcs/`/`npcs/` folder split applies here. Group into per-resource folders instead, e.g. `models/character/` (`character.py`, `character_link.py`, `character_photo.py`, `character_treasure.py`), `models/game/` (`game.py`, `game_photo.py`, `game_session.py`, `game_master.py`, `game_treasure.py`, `player.py`), `models/treasure/` (`treasure.py`, `treasure_photo.py`), keeping cross-cutting/standalone models (`link.py`, `upload.py`, `user_profile.py`, `password_reset_token.py`, `task.py`) at the top level.
- Document the serializers/models folder conventions (mirroring `views-organization.md`'s style) so future contributions follow them consistently.
- Keep the existing `__init__.py` re-export convention so external usage (`from . import views`, `from .models import Character`, etc.) doesn't change.
- Pure reorganization — no behavior change. Existing URL paths, public view/serializer/model names, and behavior must be preserved, and all tests must keep passing (aside from internal import path updates).

## Benefits
- Easier to locate the code for a given resource or sub-resource.
- Smaller, single-purpose files instead of large flat directories and one large `urls.py`.
- Consistent folder structure across `urls/`, `views/`, `serializers/`, and `models/` that mirrors the API's resource hierarchy, aligned with the already-documented views convention.
- Completes the first migration slice explicitly called out by issue #348.
