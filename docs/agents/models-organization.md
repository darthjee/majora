# Models Folder Organization

This document defines the folder convention for `backend/games/models/` (and its mirrored
`backend/games/tests/models/` tree). It exists so the file responsible for any given model
is always predictable from its path alone.

## The convention

1. A resource folder (`character/`, `game/`, `treasure/`) holds that resource's own model
   and the models that only make sense attached to it: photos, links, and other
   through/child models.
2. There is **no** PC/NPC split here, unlike `views/` and (partially) `serializers/`:
   `Character` is a single model — the `npc` boolean field distinguishes a PC from an NPC,
   not a separate model or table — so `models/character/` is not further split into
   `pcs/`/`npcs/` subfolders.
3. `models/game/` also holds `player.py`: a `Player` only exists in relation to the games
   they're linked to, and `Game`/`Player`/`GameMaster`/`GameSession`/`GameTreasure` form one
   tightly coupled resource group.
4. Cross-cutting or standalone models that aren't owned by one specific resource stay at
   the top level of `models/`: `link.py` (a generic link attachable to multiple object
   types via `GenericForeignKey`), `upload.py` (a generic pending-upload record),
   `user_profile.py`, `password_reset_token.py`, and `task.py` (a DM checklist item scoped
   to a game, but modeled as its own standalone concept rather than a `Game` sub-model).
5. Filenames keep their current descriptive names — only their folder location changes. No
   renaming to generic names like `index.py`/`model.py`.
6. `backend/games/tests/models/` mirrors the identical tree, one test file per model file.

## Worked examples

| Model | File |
|---|---|
| `Character` | `backend/games/models/character/character.py` |
| `CharacterLink` | `backend/games/models/character/character_link.py` |
| `CharacterPhoto` | `backend/games/models/character/character_photo.py` |
| `CharacterTreasure` | `backend/games/models/character/character_treasure.py` |
| `Game` | `backend/games/models/game/game.py` |
| `GameMaster` | `backend/games/models/game/game_master.py` |
| `GamePhoto` | `backend/games/models/game/game_photo.py` |
| `GameSession` | `backend/games/models/game/game_session.py` |
| `GameTreasure` | `backend/games/models/game/game_treasure.py` |
| `Player` | `backend/games/models/game/player.py` |
| `Treasure` | `backend/games/models/treasure/treasure.py` |
| `TreasurePhoto` | `backend/games/models/treasure/treasure_photo.py` |
| `Link`, `Upload`, `UserProfile`, `PasswordResetToken`, `Task` | stay at `backend/games/models/` (cross-cutting/standalone) |

## Stability of public re-exports

`backend/games/models/__init__.py` re-exports every model class by name (e.g.
`from games.models import Character`), and `admin.py`/`versioning/admin.py` both import
via that package, not a submodule path — so this re-export list is the only import path
callers outside `models/` should use, and it does not change when files move between
folders inside `models/`. Only the internal import paths inside `__init__.py` (and any
model that imports a sibling model directly for a type reference, e.g. `character.py`
importing `Game`/`Player`) need to track a file's actual folder. Foreign keys declared
with a string reference (e.g. `models.ForeignKey('games.Character', ...)`) are resolved by
Django's app registry using the app label and class name, not the file path, so they are
completely unaffected by this reorganization.

Moving model files without changing any class's `Meta` options or the `models/__init__.py`
re-exports is a pure Python reorganization: Django's migration state tracks app label,
model name, and field definitions, never file paths, so no new migration is produced by a
change like this one (verified via `manage.py makemigrations --check --dry-run`).
