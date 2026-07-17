# Issue: Add filters in treasures page

## Description
The treasures list page (`/#/treasures`, backed by `/treasures.json`) shows all unassigned treasures with no way to narrow the results. As the list grows, staff need to filter it down.

## Expected Behavior
On `/#/treasures`, staff can filter the treasure list by:
- **Game type**: single-select dropdown (D&D, Deadlands, or all)
- **Value range**: `min_value` and `max_value` (inclusive)
- **Name**: partial, case-insensitive match (`LIKE %name%`)

Filters are combinable (AND) and applying/changing a filter resets pagination to page 1.

## Solution
Follow the existing full-stack filter pattern used by the NPC list page:
- Backend: extend `treasures_list` (`backend/games/views/treasures/treasures_list.py`) to read `game_type`, `min_value`, `max_value`, and `name` from query params and apply them to the queryset (`value__gte`/`value__lte`/`name__icontains`/`game_type`), similar to the filtering already done in `backend/games/views/games/game_treasures.py`.
- Frontend: add a filters component analogous to `NpcFilters.jsx` (dropdown for game type, text inputs for min/max value and name), wired through the hash route query params the same way `GameNpcsController` does, so filters and pagination stay in the URL.

## Benefits
Staff can quickly narrow down the treasure list instead of scanning the full unfiltered set.
