# Issue: Refactor game views folder structure

## Problem
The folder `backend/games/views/game/` currently contains 32 flat `_*.py` files
at its root level, alongside 4 already-organized subfolders (`conversations/`,
`npcs/`, `pcs/`, `players/`). These flat files contain shared PC/NPC view logic
grouped by domain but without folder structure, making navigation difficult and
inconsistent with the domain-oriented navigability the Views Organization
convention encourages elsewhere in the codebase.

## Solution

### Proposed structure
Organize the flat files into domain subfolders:

| Domain | Files | Target folder |
|--------|-------|---------------|
| Documents | `_document_content.py`, `_document_exchange.py`, `_document_files.py`, `_document_photos.py`, `_document_summary.py`, `_documents.py` | `game/documents/` |
| Factions | `_faction_exchange.py`, `_faction_summary.py`, `_factions.py` | `game/factions/` |
| Items | `_item_create.py`, `_item_exchange.py`, `_item_photo_upload.py`, `_item_summary.py`, `_item_update.py`, `_items.py` | `game/items/` |
| Photos | `_photo_deletable.py`, `_photo_detail.py`, `_photo_set.py`, `_photo_upload.py`, `_photos.py` | `game/photos/` |
| Possessions | `_possession_create.py`, `_possession_exchange.py`, `_possessions.py` | `game/possessions/` |
| Treasures | `_treasure_exchange.py`, `_treasure_summary.py`, `_treasures.py` | `game/treasures/` |

The following shared/general files remain at `game/` root:
- `_character_shared.py` (factory hub)
- `_shared.py`, `_decorators.py`, `_detail.py`, `_full.py`, `_regular.py`

### Scope
- Move files to domain subfolders (filenames unchanged per Views Organization convention)
- Update imports in `_character_shared.py` for the moved files
- Update imports in the 16 additional consumer files that import the flat files
  directly (beyond `_character_shared.py`): `game/pcs/detail/{documents,factions,items,treasures}/*.py`
  and `game/npcs/detail/{documents,factions,items,treasures}/*.py` (the photos and
  possessions domains have no such direct consumers)
- Update each moved file's own relative imports one level deeper, for `_decorators`,
  `_shared`, `common`, `models`, `serializers`, and (for the document/faction/item/possession
  exchange files) `_treasure_filters`/`_treasure_context`
- Update `__init__.py` files as needed (note: the public `__init__.py` only imports
  from subfolders `conversations/`, `npcs/`, `pcs/`, `players/` -- not from flat
  `_*.py` -- so it is likely unaffected)
- No changes needed under `backend/games/tests/views/game/`: it has no flat files
  to move. Domain-specific tests already live nested under `pcs/detail/<domain>/`
  and `npcs/detail/<domain>/`, and exercise views via `reverse()` plus an HTTP client
  rather than importing view modules directly, so there is no import-path
  dependency to update there.

### Approach
One commit per domain (documents, factions, items, photos, possessions, treasures)
to follow atomic commit guidelines. No circular or cross-domain imports exist
between the flat files, so domain-by-domain commits are safe as long as each
commit is self-contained: the moved files' own imports, the imports
`_character_shared.py` uses for that domain, and any direct consumer files in `pcs/detail/<domain>/`
and `npcs/detail/<domain>/`.

### References
- Views Organization (a related convention -- it documents resource-nesting for
  route-mapped views, not a strict requirement for this internal shared-helper
  file category): `docs/agents/views-organization.md`
- Contributing rules: `docs/agents/contributing.md`
- Factory pattern: `backend/games/views/game/_character_shared.py`
