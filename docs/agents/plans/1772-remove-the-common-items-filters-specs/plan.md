# Plan: Remove the common items filters specs

Issue: [1772-remove-the-common-items-filters-specs.md](../../issues/1772-remove-the-common-items-filters-specs.md)

## Overview

Retire the temporary Epic #1766 specs (`docs/agents/specs/common-items-filters.md` and
`docs/agents/specs/common-items-filters/`) now that #1770 (backend) and #1771 (frontend) are
merged. First port the few durable facts the permanent docs still miss, then unregister and
delete the specs. Docs-only; owned by the architect.

## Context

`docs/agents/access-control/game-common-item.md` already documents the filter semantics added by
#1770: the `name` / `category` / `min_price` / `max_price` params, AND-combination, empty and
unknown values, `int()` parsing, ordering after the hidden filter and GameEdit gate, before
pagination, and unknown params (including `?hidden=`) ignored. What the permanent docs do
**not** yet record:

- Where the code lives: the shared int-range helpers `filter_by_min` / `filter_by_max` in
  `backend/common/query_filters.py` (treasure `filter_by_min_value` / `filter_by_max_value` are
  thin wrappers over them) and the local `backend/games/views/games/_common_item_filters.py`
  (`filter_by_category`, `apply_common_item_filters`).
- Two pieces of rationale: an empty `?category=` is treated as absent, a deliberate deviation
  from the recipes `category` filter, which returns an empty list; and `filter_by_category` stays
  local rather than becoming a generic `common/` choice filter, because the recipes filter
  differs (hidden-output masking, empty-value handling).
- The cache note: Navi (`navi/resources/common_items.yml`) warms only unfiltered pages; filtered
  URLs are plain cache misses.
- Frontend: trimming of `name` before sending (rule #15). Check whether `docs/agents/frontend/`
  already covers the common items filter bar; if not, add a short line only if a matching
  page exists. Do not create a new page for it.

Everything else in the specs (sub-issue table, numbered rules, test matrix, lifecycle,
non-goals) is Epic scaffolding and is dropped.

## Implementation Steps

### Step 1 — Port durable content into permanent docs

- In `docs/agents/access-control/game-common-item.md`, extend the filters paragraph with:
  - the helper locations (`common.query_filters.filter_by_min` / `filter_by_max`, and
    `games/views/games/_common_item_filters.py`), following the style already used in
    `access-control/source.md` / `collection.md` for `common.query_filters.filter_by_name`;
  - the empty-`category` deviation from recipes, and why `filter_by_category` stays local;
  - the no-Navi-change note for filtered URLs.
- Read `docs/agents/specs/common-items-filters/frontend.md` and compare it with the frontend
  docs under `docs/agents/frontend/`. Port anything durable and non-obvious from code (e.g. hash
  state / query building conventions) into an existing frontend page if one fits; otherwise
  drop it.
- Never link from the permanent docs into `docs/agents/specs/common-items-filters/`.

### Step 2 — Unregister, delete and verify

- Remove `- [Common Items Filters](specs/common-items-filters.md)` from `docs/agents/specs.md`.
- `git rm` `docs/agents/specs/common-items-filters.md` and the
  `docs/agents/specs/common-items-filters/` folder (`api-contract.md`, `backend.md`,
  `frontend.md`, `testing.md`).
- Run `grep -rn common-items-filters docs/ AGENTS.md .claude/` and confirm the only hits are
  under `docs/agents/issues/` and `docs/agents/plans/`.

## Files to Change

- `docs/agents/access-control/game-common-item.md`: add helper locations, rationale and cache
  note.
- `docs/agents/frontend/*.md`: only if a matching page exists and durable content is missing.
- `docs/agents/specs.md`: drop the Common Items Filters entry.
- `docs/agents/specs/common-items-filters.md`: delete.
- `docs/agents/specs/common-items-filters/`: delete (4 files).

## CI Checks

- Markdown: `yarn lint_md` at the repo root, run through docker-compose per AGENTS.md (CI job:
  `markdownlint`).

## Notes

- No code, tests, translations or Navi config change.
- Keep additions to `game-common-item.md` short; it is an access-control page, so implementation
  pointers should be one-line references, not a copy of the spec.
