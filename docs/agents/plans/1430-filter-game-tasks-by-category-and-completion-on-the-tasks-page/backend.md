# Backend Plan: Filter game tasks by category and completion on the Tasks page

Main plan: [plan.md](plan.md)

## Shared contracts

Produces the API contract from [plan.md](plan.md#api-get-gamesgame_slugtasks-backend--frontend):
optional `category` (exact match against `Task.CATEGORY_CHOICES`) and `completed`
(`true`/`false`, case-insensitive) query params on `GET /games/:game_slug/tasks`, combined with
AND, applied before pagination. Unknown values are ignored (no filter, 200). Nothing else about
the endpoint changes.

## Implementation Steps

### Step 1 — Filter the tasks list by `category` and `completed`

In `game_tasks_list.py`, move the GET branch into a `_list_tasks(request, game)` helper (like
`game_polls_list._list_polls`) that narrows `game.tasks.all()` through two small helpers before
calling `paginated_list_response`:

- `_filter_by_category(request, queryset)`: reads `request.query_params.get('category')` and
  filters only when the value is in `{value for value, _ in Task.CATEGORY_CHOICES}` (exact, case
  sensitive).
- `_filter_by_completed(request, queryset)`: reads `completed`, filters only when
  `value.lower() in ('true', 'false')`, mapping to a boolean (same shape as
  `_filter_by_slain` in `games/views/game/_character/_shared.py`).

Keep the permission check and POST branch unchanged; no `X-Skip-Cache` change (the view is
already `@restricted`). Docstrings in the existing style; lines ≤ 100 chars.

### Step 2 — View tests

Extend `TestGameTasksListView` with tests for: `category` alone narrows results; `completed=true`
and `completed=false` (plus a mixed-case value like `True`) narrow results; both combined (AND);
an unknown `category` (`cooking`, `Painting`) and an unknown `completed` (`maybe`) return
the unfiltered list with 200; no params returns every task; filters never leak tasks of another
game; pagination headers reflect the filtered count.

## Files to Change

- `backend/games/views/game_tasks/game_tasks_list.py` — `_list_tasks` + the two filter helpers.
- `backend/games/tests/views/game_tasks/game_tasks_list_test.py` — new filter tests.

## CI Checks

- `backend`: `docker-compose run --rm majora_tests pytest games/tests/views/game_tasks` and the
  full suite (CI job: backend `Tests`).
- `backend`: `docker-compose run --rm majora_tests poetry run ruff check .` and
  `bin/reports.sh ci` (CI: `Check python Lint`, `Check Python complexity`).

## Notes

- No migration, serializer, model or Navi change (tasks are DM-private and not cache-warmed).
- No index needed: the queryset is already scoped to one game's tasks.
