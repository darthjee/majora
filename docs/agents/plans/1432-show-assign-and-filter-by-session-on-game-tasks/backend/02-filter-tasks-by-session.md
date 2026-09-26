# Filter the tasks list by session

In `games/views/game_tasks/game_tasks_list.py`, add a `_filter_by_session(request, queryset)` step to `_list_tasks`, next to `_filter_by_category` and `_filter_by_completed`:

- `session` param is all digits → `queryset.filter(session_id=int(value))`. An id from another game simply returns an empty list, because the queryset is already scoped to `game.tasks`.
- `session` param equals `none` (case-insensitive) → `queryset.filter(session__isnull=True)`.
- Absent or anything else → no filtering, like the other filters.

Also add `select_related('session')` to the base queryset, since the payload now includes the session title. Update the `_list_tasks` docstring.

Tests: filter by id, by `none` (any case), invalid value ignored, and combined with `category` + `completed`.

## Files to Change
- `backend/games/views/game_tasks/game_tasks_list.py` — `_filter_by_session` and `select_related`.
- `backend/games/tests/...game_tasks_list...` — filter specs.
