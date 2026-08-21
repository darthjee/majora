# Issue: Reorganize character shared view modules into _character/ subfolders

## Problem

`backend/games/views/game/` currently holds 8 shared per-resource modules flat at its root: `_character_shared.py` (77 lines), `_document_shared.py` (288), `_faction_shared.py` (199), `_item_shared.py` (221), `_photo_shared.py` (75), `_possession_shared.py` (210), `_treasure_shared.py` (119), `_treasure_finder.py` (38). Each holds the `build_*_view(npc=)` factory functions consumed by the wrapper view files for its resource. Alongside them sit 5 character-wide helper modules (`_shared.py`, `_decorators.py`, `_detail.py`, `_full.py`, `_regular.py`) that aren't per-resource.

This is optional cleanup, lower priority than the sibling sub-issues of #1223 — 8 files at 75–290 lines each is not urgent restructuring the way 35+ tiny flat files would be. Do this one last relative to the other sub-issues split from #1223 (documents, factions, items, possessions, treasures, photos), since every wrapper view file those sub-issues move also imports from one of these shared modules — moving the shared modules after the view files reach their final location means each import path is updated once, not twice.

Sub-issue of #1223 (parent: "Refatoração: listar arquivos de views de 'characters' (PC/NPC) para divisão"). Scope is independent of the other 6 sub-issues split from #1223, but its changes touch the same wrapper files those sub-issues also move — land this one last.

## Solution

### Affected Files

`backend/games/views/game/`:
- `_character_shared.py` → `_character/__init__.py` (its content — the cross-domain view-factory helpers — becomes the package's `__init__.py` directly; per parent issue #1223's Target Structure, `__init__.py` "replaces `_character_shared.py`")
- `_document_shared.py` → `_character/documents/_document_shared.py`
- `_faction_shared.py` → `_character/factions/_faction_shared.py`
- `_item_shared.py` → `_character/items/_item_shared.py`
- `_photo_shared.py` → `_character/photos/_photo_shared.py`
- `_possession_shared.py` → `_character/possessions/_possession_shared.py`
- `_treasure_shared.py` and `_treasure_finder.py` → `_character/treasures/_treasure_shared.py` and `_character/treasures/_treasure_finder.py`
- `_shared.py`, `_decorators.py`, `_detail.py`, `_full.py`, `_regular.py` (character-wide helpers, not per-resource) → `_character/_shared.py`, `_character/_decorators.py`, `_character/_detail.py`, `_character/_full.py`, `_character/_regular.py`

Every wrapper view file across `game/{npcs,pcs}/detail/{documents,factions,items,possessions,treasures,photos}/**` that imports one of these shared modules needs its import path updated to the new location.

### Decisions

1. Purely structural move — no behavior or API changes.
2. Group the shared modules into `_character/` with one subfolder per resource (`documents/`, `factions/`, `items/`, `photos/`, `possessions/`, `treasures/`), mirroring the view folder hierarchy the sibling sub-issues establish.
3. `_character_shared.py`'s content becomes `_character/__init__.py` directly — no separate `_shared_hub.py`. This matches parent issue #1223's Target Structure, and `_character_shared.py` already imports from `_full.py`/`_shared.py` (moving to `_detail.py`/`_full.py`/`_regular.py`/`_shared.py`/`_decorators.py` under the same package) rather than re-exporting other resources' factories.
4. Run this sub-issue's changes after the 6 sibling sub-issues (documents, factions, items, possessions, treasures, photos) have landed, so it only needs to update each wrapper file's import path once, against final view-file locations. If it lands first instead, expect the sibling sub-issues' PRs to need a rebase to pick up the new shared-module paths.
5. Update every import site across both `npcs/` and `pcs/` trees (and their tests, if tests import shared modules directly rather than through the view wrappers).

### Acceptance Criteria

- [ ] All 8 shared modules (+ the 5 character-wide helper modules) moved into `_character/` with the subfolder layout above.
- [ ] `_character_shared.py`'s content lands in `_character/__init__.py` (no `_shared_hub.py`).
- [ ] Every import of a moved module, across the full `game/{npcs,pcs}/**` view tree, updated to the new path.
- [ ] Full backend test suite passes.
- [ ] No behavior change.
