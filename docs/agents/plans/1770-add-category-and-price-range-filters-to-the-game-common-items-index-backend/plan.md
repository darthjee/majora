# Plan: Add category and price-range filters to the game common items index (backend)

Issue: [1770-add-category-and-price-range-filters-to-the-game-common-items-index-backend.md](../../issues/1770-add-category-and-price-range-filters-to-the-game-common-items-index-backend.md)

## Overview

Add `category`, `min_price` and `max_price` filters (next to `name`) to both game common
items indexes, moving the int-range parsing into shared helpers in `common/query_filters.py`
while keeping the treasure helpers as transparent wrappers. Single owner: backend.

See [backend.md](backend.md) for the full plan.
