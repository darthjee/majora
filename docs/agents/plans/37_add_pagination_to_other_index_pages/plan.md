# Plan: Add pagination to other index pages

Issue: [37_add_pagination_to_other_index_pages.md](../issues/37_add_pagination_to_other_index_pages.md)

## Branch

`issue-37-paginate-games-and-pcs`

## Overview

Extend the reusable `Paginator` from issue #36 to the `games_list` and `game_pcs` views. The frontend for both pages already fully implements pagination (fetchIndex, pagination state, Pagination component) — only backend changes are needed.

## Agents involved

- [Backend](backend.md)
