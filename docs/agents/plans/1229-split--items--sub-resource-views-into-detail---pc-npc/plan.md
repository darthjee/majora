# Plan: Split 'items' sub-resource views into detail/ (PC/NPC)

Issue: [1229-split--items--sub-resource-views-into-detail---pc-npc.md](../../issues/1229-split--items--sub-resource-views-into-detail---pc-npc.md)

## Overview

Purely structural move within `backend/games/views/game/{npcs,pcs}/detail/items/`: split the 9 member-action view files (per tree) out of the flat `items/` folder into a new `items/detail/` subfolder, per the [Views Organization Convention](../../views-organization.md), while the 4 collection view files stay in `items/`. Mirrored test files move alongside, relative imports gain one `..` level, and the two `__init__.py` re-export files are updated to match. No behavior change.

See [backend.md](backend.md) for the full plan.
