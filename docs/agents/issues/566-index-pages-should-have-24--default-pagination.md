# Issue: Index pages should have 24 default pagination

## Description
Index pages that support pagination currently default to a page size of 16 (via the global `MAJORA_PAGINATION_SIZE` setting / `Settings.pagination_size()` in `backend/games/settings.py`, used by `Paginator._per_page()` in `backend/games/paginator.py`). This default should be changed to 24.

## Problem
16 does not divide evenly against the card-grid column breakpoints used on index pages such as Games (`col-sm-6 col-md-4 col-lg-3` in `GameCardHelper.jsx`, i.e. 2/3/4 cards per row depending on viewport). This leaves a partial, uneven last row on some breakpoints. 24 divides evenly across all of those breakpoints (2, 3, and 4 cards per row), producing full rows with no dangling partial row.

## Expected Behavior
Index pages that use the shared pagination mechanism return 24 items per page by default when no `per_page` query param is provided, instead of 16.

## Solution
Change the default value backing `Settings.pagination_size()` in `backend/games/settings.py` (the fallback used when `MAJORA_PAGINATION_SIZE` is not set) from 16 to 24. This is consumed by `Paginator._per_page()` in `backend/games/paginator.py`, which backs `paginated_list_response()` in `backend/games/views/common.py` — shared by essentially all index endpoints (games, PCs, NPCs, treasures, photos, sessions, polls, tasks, staff users list). The frontend has no hardcoded page size and simply relies on the backend default, so no frontend change is required.

Out of scope: `backend/games/session_message_paginator.py`'s hardcoded `PAGE_SIZE = 20`, which paginates session chat messages via cursor pagination, not a visual grid index page.

## Benefits
- Grid-based index pages (like Games) render full rows at common breakpoints instead of a partial trailing row.
- Single shared default, so the fix is a one-line change with broad, consistent effect across all index pages.
