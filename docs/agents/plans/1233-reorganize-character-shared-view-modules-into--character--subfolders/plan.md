# Plan: Reorganize character shared view modules into _character/ subfolders

Issue: [1233-reorganize-character-shared-view-modules-into--character--subfolders.md](../issues/1233-reorganize-character-shared-view-modules-into--character--subfolders.md)

## Overview

Move the 8 per-resource shared view-factory modules (`_character_shared.py`, `_document_shared.py`, `_faction_shared.py`, `_item_shared.py`, `_photo_shared.py`, `_possession_shared.py`, `_treasure_shared.py`, `_treasure_finder.py`) and the 5 character-wide helper modules (`_shared.py`, `_decorators.py`, `_detail.py`, `_full.py`, `_regular.py`) from flat files under `backend/games/views/game/` into a `_character/` package, one subfolder per resource. Then fix every import that pointed at their old flat location — both the wrapper view files under `game/{npcs,pcs}/detail/**` and a handful of files elsewhere in `game/` that import these modules directly.

See [backend.md](backend.md) for the full plan.
