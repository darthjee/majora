# Plan: Add pagination to npcs page

Issue: [36_add_pagination_to_npcs_page.md](../issues/36_add_pagination_to_npcs_page.md)

## Branch

`issue-36-npcs-pagination`

## Overview

The frontend pagination infrastructure (Pagination component, PaginationHelper, GameNpcsController with `fetchIndex`, GenericClient reading `page`/`pages`/`per_page` headers) is already fully implemented. Only backend work is needed: a `Settings` class to read `MAJORA_PAGINATION_SIZE`, a reusable `Paginator` class that slices querysets and sets response headers, and wiring it into the `game_npcs` view.

## Agents involved

- [Backend](backend.md)
- [Frontend](frontend.md)

## Shared contracts

The `game_npcs` endpoint (`GET /games/:game_slug/npcs.json`) returns:
- **Body**: JSON array of character objects (same shape as before)
- **Response headers**:
  - `page` — current page number (integer)
  - `pages` — total number of pages (integer)
  - `per_page` — items per page (integer)
  - `total` — total item count (integer)
- **Query params accepted**: `page` (integer), `per_page` (integer)
