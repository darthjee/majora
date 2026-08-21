# Plan: Split 'possessions' sub-resource views into detail/ (PC/NPC)

Issue: [1230-split-possessions-sub-resource-views-into-detail-pc-npc.md](../issues/1230-split-possessions-sub-resource-views-into-detail-pc-npc.md)

## Overview

Purely structural refactor, entirely inside `backend/`: move the 6 member-action possession
view files (×2, NPC and PC trees) out of `possessions/` into a new `possessions/detail/`
subfolder, per the [Views Organization Convention](../views-organization.md), and update the
resulting import paths. No behavior change.

See [backend.md](backend.md) for the full plan.
