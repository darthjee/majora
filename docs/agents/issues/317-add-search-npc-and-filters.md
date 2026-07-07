# Add search NPC and filters

## Context

The NPC list page (`/#/games/:game_slug/npcs`) currently has no way to filter or search NPCs. Users (players and admins/DMs) must page through the full, unfiltered, paginated list to find a specific NPC, which becomes cumbersome in games with many NPCs.

Backend-wise, neither the public `/games/:game_slug/npcs.json` endpoint nor the admin `/games/:game_slug/npcs/all.json` endpoint currently accept any filtering query params — both apply only fixed, hardcoded filters (`npc=True, hidden=False` for the public one).

## What needs to be done

Add a filter/search component to the game NPCs list page, positioned above the list (below the headers and the back/new buttons):

- A "Status" dropdown (blank / Alive / Slain), mapping to the NPC's boolean `slain` field.
- A "Name" search text input.
- A "Query"/"Filter" button.
- A "Clear" button.

Behavior:

- All dropdown filters support a blank option meaning that filter is not applied.
- Clicking the Query button sends a new request with the current filter values as query params, using whichever endpoint the user already gets today (the admin `.../all.json` endpoint when logged in as admin/DM, the public `.../npcs.json` endpoint otherwise) — same role-based routing as today, just with filters added.
- The result list and pagination are rebuilt from the filtered response.
- Once a query is applied, the filters are reflected in the navigation bar's URL (as additional query params), the same way pagination already updates the URL.
- The result can be produced either by a direct filtered request (button click) or by loading/navigating to a URL that already contains filter query params (deep link), consistent with how pagination params are read today. When loaded this way, the filter fields are pre-populated from the URL.
- Pagination links, when filters are active, keep the current filters (in addition to `page`/`per_page`) when clicked.
- The Name filter matches case-insensitively, anywhere in the name (`icontains`).
- The Clear button resets all filter fields to blank and immediately re-fetches the unfiltered list.

Implementation:

- Frontend: add a new filter component (no existing filter/search component exists elsewhere in the frontend to reuse) rendered above the NPC list, wired into `GameNpcsController`/`GameCharactersHelper` to read/write filter query params via `HashRouteResolver`, extending it beyond the current `page`/`per_page` params.
- Extend `PaginationHelper`'s link template (currently hardcoded to `page`/`per_page`) so pagination links preserve active filters.
- Backend: add query-param-driven filtering (by `slain` and `name`) to both `source/games/views/characters/game_npcs.py` and `source/games/views/characters/game_npcs_all.py`.

This makes it faster to locate specific NPCs in games with large NPC lists, and produces shareable/bookmarkable filtered URLs.

## Acceptance criteria

- [ ] A filter component (Status dropdown, Name text input, Query button, Clear button) is rendered above the NPC list on `/#/games/:game_slug/npcs`.
- [ ] The Status dropdown supports blank / Alive / Slain, mapping to the `slain` boolean field.
- [ ] Clicking Query re-fetches the list from the same endpoint the user already uses (role-based routing preserved) with filter values as query params.
- [ ] The Name filter matches case-insensitively, anywhere in the name (`icontains`).
- [ ] Applied filters are reflected in the URL as query params, and pre-populate the filter fields when the page is loaded/navigated to directly with those params.
- [ ] Pagination links preserve active filters in addition to `page`/`per_page`.
- [ ] The Clear button resets all filter fields to blank and immediately re-fetches the unfiltered list.
- [ ] Backend: `source/games/views/characters/game_npcs.py` and `source/games/views/characters/game_npcs_all.py` support filtering by `slain` and `name` query params.

---
Tags: :shipit:
