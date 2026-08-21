# Plan: Split 'documents' sub-resource views into detail/files/photos (PC/NPC)

Issue: [1227-split--documents--sub-resource-views-into-detail-files-photos--pc-npc.md](../../issues/1227-split--documents--sub-resource-views-into-detail-files-photos--pc-npc.md)

## Overview

Purely structural, backend-only change: split the flat `documents/` view folder (for both `npcs/` and `pcs/`) into `documents/` (collection actions, unchanged location), `documents/detail/` (member actions on one document), `documents/files/`, and `documents/photos/` (nested sub-resources), updating each moved file's relative import depth and the two package `__init__.py` re-export files accordingly.

See [backend.md](backend.md) for the full plan.
