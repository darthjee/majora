# Plan: Add pagination to npcs page

Issue: [36_add_pagination_to_npcs_page.md](../issues/36_add_pagination_to_npcs_page.md)

## Branch

`issue-36-npcs-pagination`

## Overview

The frontend pagination infrastructure (Pagination component, PaginationHelper, GameNpcsController with `fetchIndex`, GenericClient reading `page`/`pages`/`per_page` headers) is already fully implemented. Only backend work is needed: a `Settings` class to read `MAJORA_PAGINATION_SIZE`, a reusable `Paginator` class that slices querysets and sets response headers, and wiring it into the `game_npcs` view.

## Agents involved

- [Backend](backend.md)
