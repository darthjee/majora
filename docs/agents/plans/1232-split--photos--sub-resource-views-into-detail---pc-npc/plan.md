# Plan: Split 'photos' sub-resource views into detail/ (PC/NPC)

Issue: [1232-split--photos--sub-resource-views-into-detail---pc-npc.md](../../issues/1232-split--photos--sub-resource-views-into-detail---pc-npc.md)

## Overview

Purely structural move: the 3 member-action photo view files (and their mirrored tests) under
`backend/games/views/game/{npcs,pcs}/detail/photos/` move into a new `photos/detail/`
subfolder, leaving the collection listing file in place. No behavior change.

See [backend.md](backend.md) for the full plan.
