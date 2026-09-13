# Backend Plan: Task has no single-resource GET endpoint

Main plan: [plan.md](plan.md)

## Overview

`backend/games/views/game_tasks/game_task_detail.py` currently only handles `PATCH` for `games/<game_slug>/tasks/<task_id>.json` (routed in `backend/games/urls/games.py`). Extend the same view to also handle `GET`, returning the task's detail, gated by the same `EndpointPermission(..., 'game_task', 'restricted', 'edit')` check already used by `PATCH` and by the list endpoint (`game_tasks_list.py`) — Task has no public read path, so read stays as restricted as write. `DELETE` is explicitly out of scope for this issue.

## Implementation Steps

### Step 1 — Add the GET handler

In `backend/games/views/game_tasks/game_task_detail.py`:
- Add `'GET'` to the `@api_view([...])` decorator, alongside the existing `'PATCH'`.
- After the existing `EndpointPermission(...).check(...)` gate (unchanged — it already covers both methods since it runs before branching on `request.method`), branch: when `request.method == 'GET'`, return `Response(GameTaskListSerializer(task).data)` directly (same serializer already used for the PATCH response and by the list endpoint — no new serializer needed); otherwise fall through to the existing PATCH logic.
- Update the module docstring and the `# AllowAny: ...` comment (currently says "since this route has no GET counterpart to gate") to reflect that GET now exists and is gated the same way as PATCH.

### Step 2 — Update and extend tests

In `backend/games/tests/views/game_tasks/game_task_detail_test.py`:
- Remove `test_get_not_allowed` (GET returning 405) — it now returns real data.
- Add a `GET` coverage mirroring the existing PATCH test shape (add a `_get` helper analogous to `_patch`): DM can GET (200, correct serialized fields), superuser can GET (200), no token returns 401, non-DM/non-superuser returns 403, unknown task id returns 404, unknown game slug returns 404, task belonging to a different game's slug returns 404, and the named URL (`reverse('game-task-detail', ...)`) works for GET too.
- Update the module/class docstrings (currently "PATCH update only, no GET") to reflect that GET is now covered.

## Files to Change

- `backend/games/views/game_tasks/game_task_detail.py` — add GET handling to the existing view, update docstring/comment.
- `backend/games/tests/views/game_tasks/game_task_detail_test.py` — replace `test_get_not_allowed` with real GET coverage (success, auth/permission, 404 cases, named-URL routing).

## CI Checks

- `backend`: `poetry run pytest games/tests/views/game_tasks/` (CI job: `pytest_views_rest`, which runs `poetry run pytest games/tests/views/ --ignore=games/tests/views/game/`)
- `backend`: `poetry run ruff check .` (CI job: `checks`)

## Notes

- No serializer or URL changes needed — `GameTaskListSerializer` and the `game-task-detail` route already exist and are reused as-is.
- `DELETE` for tasks is intentionally left out of scope (per the discuss-issue dialogue on #1314); track it as a separate issue if a product need for deleting tasks comes up.
