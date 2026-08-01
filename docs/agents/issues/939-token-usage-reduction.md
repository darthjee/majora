# Issue: Token usage reduction

## Description
Follow-up to #934/#935 (docs/test-factory token reduction). A fresh token-usage report identified remaining hotspots in `docs/agents/` and a testing concern. This issue scopes the doc-side, high-ROI items the report flagged.

## Problem
- There is no lightweight, doc-level summary of the overall permission model (who can do what) — an agent has to read into `principles.md`/`common-rules.md` to reconstruct the big picture.
- `docs/agents/` has no single navigable index — `AGENTS.md`'s documentation table is the closest thing, listing every doc as a one-line row, with no per-doc abstract an agent could skim before deciding to open the full file.

Note: `docs/agents/access-control/character.md` (9.8 KB) already carries an "Agent Summary" header and its photo/treasure/item/link/document concerns are already split into sibling files from a prior pass — no further character.md split is planned in this issue. Splitting `common-rules.md`/`principles.md` (the report's other flagged hotspot) is also deferred to a separate future issue.

## Solution
- Add a top-level permission summary (roles: admin, dm, owner, player, staff, other-user; and the account-data restriction) as a **docs-only** quick-reference YAML map under `docs/agents/` — a static restatement for agents/humans to read, not consumed by any backend code path (`config_store`/`roles.py` stay as the actual code-level source of truth).
- Add `docs/agents/index.md` as a lightweight navigable table of contents (links only) for the `docs/agents/` doc set, for agents to fetch first.
- Add `docs/agents/summary.md` with a 2-4 line abstract of each doc under `docs/agents/` (content abstracts, distinct from `index.md`'s link list) — splittable into a `docs/agents/summary/` folder later if it grows.

### Permission map (general summary)
- admin has access to everything.
- dm has access to everything inside a game they are DM of.
- owner has access to everything inside a PC they own.
- players have access to regular mutation endpoints inside the game they are a player of.
  - staff can perform regular mutations as if they were a player of any game.
- other users have no access to most mutations (unless it is on their own account).
- account data is restricted to the user (unless dm or staff).
- dm and staff have access to staff endpoints.

## Benefits
- Lower token cost for agents that only need the high-level permission model or a doc pointer, without loading `principles.md`/`common-rules.md` in full.
- Faster navigation via a single index entry point plus per-doc abstracts to decide what to open.
