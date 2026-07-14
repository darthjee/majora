# Serializers Folder Organization

This document defines the folder convention for `backend/games/serializers/` (and its
mirrored `backend/games/tests/serializers/` tree). It exists so the file responsible for
any given serializer is always predictable from its path alone.

## The convention

1. A resource folder (`characters/`, `games/`, `treasures/`, `staff/`, `auth/`, ...) holds
   the serializers for that resource: access/permissions checks, create/update payloads,
   list/detail representations.
2. `Character` is a single model — the `npc` boolean field distinguishes PCs from NPCs, not
   a separate model or serializer base class — so most `character_*` serializers live
   directly in `characters/` and serve both PCs and NPCs generically. A PC/NPC sub-split
   (`characters/pcs/`, `characters/npcs/`) is used **only** for the serializers whose
   logic genuinely differs per role: `pc_access.py` (the PC-only access serializer exposing
   `is_owner`) and `npc_slain_update.py` (the NPC-only player-facing slain-toggle
   serializer).
3. A resource's own nested sub-resources get their own subfolder, mirroring how the game
   itself owns sessions/tasks/treasures: `games/sessions/`, `games/tasks/`,
   `games/treasures/`.
4. Cross-cutting or standalone serializers that aren't specific to one resource stay at the
   top level of `serializers/`: `base_access.py`, `base_permissions.py` (shared base
   classes subclassed by every resource's access/permissions serializer), `link.py`
   (used by both games and characters), `photo_upload.py` (shared upload-init payload).
5. Filenames keep their current descriptive names — only their folder location changes. No
   renaming to generic names like `index.py`/`detail.py`.
6. `backend/games/tests/serializers/` mirrors the identical tree, one test file per
   serializer file (where a dedicated test exists — some serializers, like the
   permissions/access ones without their own behavior beyond the shared base class, are
   only covered indirectly via view-level tests and have no dedicated serializer test
   file).

## Worked examples

| Serializer | File |
|---|---|
| `CharacterDetailSerializer` | `backend/games/serializers/characters/character_detail.py` |
| `CharacterUpdateSerializer` | `backend/games/serializers/characters/character_update.py` |
| `PcAccessSerializer` (PC-only) | `backend/games/serializers/characters/pcs/pc_access.py` |
| `NpcSlainUpdateSerializer` (NPC-only) | `backend/games/serializers/characters/npcs/npc_slain_update.py` |
| `GameDetailSerializer` | `backend/games/serializers/games/game_detail.py` |
| `GameSessionDetailSerializer` | `backend/games/serializers/games/sessions/game_session_detail.py` |
| `GameTaskListSerializer` | `backend/games/serializers/games/tasks/game_task_list.py` |
| `GameTreasureUpdateSerializer` | `backend/games/serializers/games/treasures/game_treasure_update.py` |
| `TreasureDetailSerializer` (top-level, not game-scoped) | `backend/games/serializers/treasures/treasure_detail.py` |
| `StaffUserDetailSerializer` | `backend/games/serializers/staff/staff_user_detail.py` |
| `MyAccountDetailSerializer` | `backend/games/serializers/auth/my_account_detail.py` |
| `BaseAccessSerializer`, `LinkSerializer`, `PhotoUploadSerializer` | stay at `backend/games/serializers/` (cross-cutting) |

## Stability of public re-exports

`backend/games/serializers/__init__.py` re-exports every serializer class by name (e.g.
`from games.serializers import CharacterDetailSerializer`); this is the only import path
callers outside `serializers/` should use, and it does not change when files move between
folders inside `serializers/`. Only the internal import paths inside `__init__.py` (and
any serializer that imports a sibling serializer directly, e.g.
`character_full.py` importing `character_detail.py`) need to track a file's actual folder.
