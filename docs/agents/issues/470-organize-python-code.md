# Issue: Organize Python code

## Description
The Python code for the games module (`backend/games`) has grown large and needs better organization: `urls.py`, `views/`, `serializers/`, and `models/` should all be broken down into folders that mirror the API's resource hierarchy (one folder per resource, one sub-folder per sub-resource).

## Problem
- `backend/games/urls.py` is a single flat file (~200 lines) listing every route for every resource (games, characters, treasures, staff, auth, uploads, etc.), making it hard to see which routes belong to which resource.
- `backend/games/views/` is already split into one folder per top-level resource (e.g. `characters/`, `games/`, `treasures/`, `game_masters/`), but sub-resources aren't broken down further — `views/characters/` mixes PC and NPC view files flatly (`game_pc_detail.py`, `game_npc_detail.py`, `game_pc_access.py`, `game_pc_permissions.py`, `game_pc_full.py`, `game_pc_treasures.py`, `game_pc_treasure_acquire.py`, `game_pc_treasure_sell.py`, `game_pc_photo_upload.py`, `game_pc_photo_set.py`, `game_pc_photos.py`, and their `npc_` equivalents) instead of nesting them under `pcs/` and `npcs/` sub-folders, with further nesting for shared concerns like photos and treasures.
- `backend/games/serializers/` and `backend/games/models/` are entirely flat directories with no per-resource folder structure at all, mixing files for every resource (character, game, treasure, link, upload, ...) side by side.

## Expected Behavior
- `backend/games/urls.py` acts as a hub that composes URL patterns from per-resource files/folders (mirroring the views folder structure), instead of declaring every route inline.
- `backend/games/views/characters/` is broken down into `pcs/` and `npcs/` sub-folders following the URL hierarchy: every currently `game_pc_*`/`game_npc_*`-prefixed view (access, permissions, full, treasures + acquire/sell, photo_upload, photo_set, photos) moves under its matching sub-package, with `photos/` and `treasures/` as further nested sub-packages.
- `backend/games/serializers/` and `backend/games/models/` get the same resource/sub-resource folder treatment as views (e.g. a `characters/` folder with `pcs/` and `npcs/` sub-folders where the pc/npc distinction applies).

## Solution
- Introduce per-resource URL modules (e.g. `urls/games.py`, `urls/characters.py`, `urls/treasures.py`, ...) and have `backend/games/urls.py` import and concatenate their `urlpatterns`.
- Restructure `backend/games/views/characters/` into `pcs/` and `npcs/` sub-packages, moving every `game_pc_*`/`game_npc_*` view into its matching sub-package, with further `photos/` and `treasures/` sub-packages for those shared concerns.
- Drop the now-redundant `pc_`/`npc_` prefix from moved file and function names, since the folder path already encodes that context (e.g. `characters/pcs/detail.py` exposing `detail`, imported and re-exported as needed to keep the public view names used by `urls.py` and tests unchanged).
- Apply the equivalent folder-per-resource (and pcs/npcs sub-folder, where relevant) restructuring to `backend/games/serializers/` and `backend/games/models/`.
- Keep the existing `__init__.py` re-export convention (each folder's `__init__.py` exposes its public views/serializers/models/urlpatterns) so external usage (`from . import views`, `from .models import Character`, etc.) doesn't change.
- Pure reorganization — no behavior change. Existing URL paths, public view/serializer/model names, and behavior must be preserved, and all tests must keep passing (aside from internal import path updates).

## Benefits
- Easier to locate the code for a given resource or sub-resource.
- Smaller, single-purpose files instead of large flat directories and one large `urls.py`.
- Consistent folder structure across `urls/`, `views/`, `serializers/`, and `models/` that mirrors the API's resource hierarchy.
