# Issue: Remove the game content copy specs

## Description

The "copy content between games" feature (epic #1550) was designed in temporary specs under `docs/agents/specs/`: the index `game-content-copy.md` and the pages in `game-content-copy/` (global: `page.md`, `copy-flow.md`, `hard-links.md`, `permissions.md`; per tab: `items.md`, `common-items.md`, `recipes.md`, `documents.md`, `factions.md`, `possessions.md`, including the characters' available-lists clearing added by #1565). Specs are temporary: they are removed once the feature is implemented and their knowledge lives in the permanent docs. This is the last issue of the epic.

## Problem

Once the feature is implemented, the specs become a stale second source of truth. They describe *planned* behavior, which drifts from the code, and permanent docs still link into them (`docs/agents/access-control/staff-copy.md` links to the index, `factions.md#names` and `permissions.md#cache`).

## Expected Behavior

- Everything still relevant from the specs (as actually implemented, not as planned) is in the permanent docs: architecture, access-control, proxy, cache-warmer and product docs.
- `docs/agents/specs/game-content-copy.md` and the `docs/agents/specs/game-content-copy/` folder no longer exist.
- The "Game Content Copy" entry is gone from "Active specs" in the `docs/agents/specs.md` hub.
- No doc in the repo links to the removed spec files.

## Solution

Follow the precedent of #1490 (access statistics specs removal, which produced `docs/agents/statistics.md`):

- Add a new permanent feature doc, `docs/agents/game-content-copy.md`, registered in `docs/agents/summary.md`, that captures the implemented design: Admin menu entry and page, copy flow (`copied_from`, name clashes, `hidden`, one request per entity, clearing characters' available lists), hard links (`Upload` link kind, proxy link handler, failure/retry), out-of-scope content, and per-tab specifics.
- Where the code diverges from the specs, document the code, not the spec.
- Move proxy-specific knowledge (link handler, path validation, cross-domain cache clear) into `docs/agents/architecture/proxy.md`, which today does not cover it, and any cache/navi notes into `docs/agents/cache-warmer.md`, if not already there.
- Repoint `docs/agents/access-control/staff-copy.md` (all three links) and any other referrer from the spec to the new permanent doc. Drop its "planned endpoints / implementation issues turn it" wording, and the "until that proxy mode exists, target-game pages on other domains may serve stale lists" caveat in its Cache section, since #1570 and #1580 implemented the cross-domain cache clear.
- Delete `docs/agents/specs/game-content-copy.md` and `docs/agents/specs/game-content-copy/`.
- Remove the entry from "Active specs" in `docs/agents/specs.md`.
- Do **not** touch `AGENTS.md`: it links only to the `specs.md` hub, which stays.

### Depends on

Every implementation issue split out from epic #1550 is now merged, so this issue is unblocked:

- #1568: backend foundation (`copied_from`, staff/copies API skeleton, staff gate)
- #1569: Upload copy origin (link uploads, failed status, `CopyLinkFinalizer`, pending links, renew)
- #1570: proxy link handler, narrowed upload route, cross-domain cache clear
- #1571: staff copy page (Admin menu, selectors, tabs, progress, pending links)
- #1572–#1577: Items, Common items, Recipes, Possessions, Factions and Documents tabs
- #1580: staff photo delete/finalize clears the cache on every domain

The closed sub-issues #1551–#1557 and #1565 only wrote the specs. The plan must describe the code as implemented, not the specs.

## Benefits

A single, accurate source of truth for the game content copy feature, with no stale design docs left behind.
