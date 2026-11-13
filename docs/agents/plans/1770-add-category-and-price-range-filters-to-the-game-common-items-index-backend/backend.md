# Backend Plan: Add category and price-range filters to the game common items index (backend)

Main plan: [plan.md](plan.md)

## Overview

Implement the backend part of Epic #1766 as specified in
[`docs/agents/specs/common-items-filters.md`](../../specs/common-items-filters.md) and its
[API contract](../../specs/common-items-filters/api-contract.md),
[Backend](../../specs/common-items-filters/backend.md) and
[Testing](../../specs/common-items-filters/testing.md) pages. Where this plan and the specs
disagree, the specs win.

## Context

- `game_common_items.py` (public, `hidden=False`) and `game_common_items_all.py` (GameEdit,
  all items, `X-Skip-Cache`) today call only `filter_by_name` before `paginated_list_response`.
- `_treasure_filters.py`'s `_filter_by_value` reads `request.GET` and hard-codes the
  `min_value` / `max_value` param names.
- `game/recipes/_recipe_filters.py` is the precedent for a category filter
  (`GameCommonItem.CATEGORY_CHOICES`, unknown value → `.none()`); it stays untouched.

## Steps

- [01 — Shared int-range helpers](backend/01-shared-int-range-helpers.md)
- [02 — Treasure helpers as wrappers](backend/02-treasure-wrappers.md)
- [03 — Common items filters module](backend/03-common-item-filters-module.md)
- [04 — Wire both views](backend/04-wire-views.md)
- [05 — Docs](backend/05-docs.md)

## CI Checks

- `backend`: `docker-compose run --rm majora_tests pytest` (CI jobs: `pytest_views_rest`,
  `pytest_all`)
- `backend`: `docker-compose run --rm majora_tests ruff check .` and
  `docker-compose run --rm majora_tests bin/reports.sh ci` (CI job: `checks`)
- `docs`: `yarn lint_md` via docker-compose (CI job: `markdownlint`) for the two Markdown files

## Notes

- Existing treasure view tests must pass **unmodified**; do not edit them to make the refactor
  pass.
- Keep parsing exactly `int(value)` + `except ValueError` (Python `int()` quirks such as
  `" 5"` → 5 are intentional and shared with treasures).
- Never run Python on the host; always go through docker-compose.
