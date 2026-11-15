# Issue: Remove the common items filters specs

## Description
Last sub-issue of Epic #1766. `docs/agents/specs/common-items-filters.md` and `docs/agents/specs/common-items-filters/` (`api-contract.md`, `backend.md`, `frontend.md`, `testing.md`) were written (#1769) as the temporary shared contract for the Epic: category and price-range filters on both game common items indexes (#1770, merged) and the filter bar on the common items page (#1771, merged).

## Problem
With both implementation sub-issues merged, the specs are no longer the source of truth and will drift from the code. Per their own Lifecycle section, they must be retired once any durable content is moved into the permanent docs.

## Expected Behavior
- Durable rules and their rationale live in permanent docs only. The filter semantics (`name`, `category`, `min_price`/`max_price`, AND-combination, ordering relative to the hidden filter and the GameEdit gate, unknown params ignored) are already in `docs/agents/access-control/game-common-item.md`, added by #1770.
- The spec index and its aspect folder are gone.
- Nothing in `docs/`, `AGENTS.md` or `.claude/` links to the removed pages.

## Solution
1. Diff the specs against the permanent docs. Move anything durable that is still missing, e.g. the edge-case rationale from `api-contract.md` into `docs/agents/access-control/game-common-item.md`, and the shared filter helper location from `backend.md` into the views/query-filter docs if relevant. Non-durable content (sub-issue table, test matrix, frontend interaction notes already reflected in code) is dropped.
2. Remove the `- [Common Items Filters](specs/common-items-filters.md)` entry from `docs/agents/specs.md`.
3. Delete `docs/agents/specs/common-items-filters.md` and `docs/agents/specs/common-items-filters/`.
4. Confirm `grep -rn common-items-filters docs/ AGENTS.md .claude/` returns no hits outside `docs/agents/issues/` and `docs/agents/plans/`.

Docs-only change. No code, tests or Navi config are touched. Owned by the architect.

### Acceptance criteria
- [ ] Durable content preserved in permanent docs
- [ ] `docs/agents/specs.md` no longer lists Common Items Filters
- [ ] Spec file and folder removed
- [ ] No dangling links to the removed pages

## Benefits
Keeps `docs/agents/specs/` limited to active Epics and leaves the permanent docs as the single source of truth for common items filtering.
